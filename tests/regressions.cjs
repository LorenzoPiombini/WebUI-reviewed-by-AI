const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');

(async () => {
    let request;
    const net = vm.createContext({ URL, Request, window: { location: { origin: 'https://company.example:8443' } },
        fetch: async req => { request = req; return new Response(JSON.stringify({message: 'Saved'}), {status: 201}); } });
    vm.runInContext(source('net.js').replace('export async function', 'async function').replace('export default send;', ''), net);
    let result = await net.send('{"name":"test"}', 'POST', 'new_customer');
    assert.equal(result.success, true);
    assert.equal(request.url, 'https://company.example:8443/new_customer');
    assert.equal(request.credentials, 'same-origin');
    assert.equal(request.redirect, 'error');
    assert.equal(await request.text(), '{"name":"test"}');
    for (const resource of ['//evil.test', 'https://evil.test', '\\evil.test', 'orders?x=y']) {
        assert.equal((await net.send(null, 'GET', resource)).success, false);
    }
    assert.equal((await net.send(null, 'POST', 'orders')).success, false);
    assert.equal((await net.send(null, 'DELETE', 'orders')).success, false);
    net.fetch = async () => new Response('failure', {status: 500});
    assert.equal((await net.send(null, 'GET', 'orders')).status, 500);
    net.fetch = async () => new Response('not JSON');
    assert.equal((await net.send(null, 'GET', 'orders')).success, false);
    let attempts = 0;
    net.fetch = async () => { attempts++; throw new Error('disconnected'); };
    result = await net.send('{}', 'POST', 'new_sales_order');
    assert.equal(result.success, false);
    assert.match(result.message, /before retrying/);
    assert.equal(attempts, 1);

    // Minimal DOM records nodes and listeners; reject any HTML-parsing sink.
    const ids = new Map();
    class Element {
        constructor(tag) { this.tag = tag; this.children = []; this.listeners = {}; this.text = ''; }
        set id(value) { this._id = value; ids.set(value, this); }
        get id() { return this._id; }
        set textContent(value) { this.text = String(value); this.children = []; }
        get textContent() { return this.text + this.children.map(x => x.textContent).join(''); }
        set innerHTML(value) { throw new Error('Unsafe HTML sink'); }
        insertAdjacentHTML() { throw new Error('Unsafe HTML sink'); }
        appendChild(child) { this.children.push(child); return child; }
        replaceChildren() { this.children = []; this.text = ''; }
        addEventListener(event, callback) { this.listeners[event] = callback; }
    }
    const document = { addEventListener() {}, getElementById: id => ids.get(id),
        createElement: tag => new Element(tag), createTextNode: text => { const e = new Element('#text'); e.textContent = text; return e; } };
    for (const id of ['sales-orders-week','purchase-orders-week','report-order-menu','cust-id','price-level','date']) {
        const e = new Element('div'); e.id = id; e.value = '1'; e.textContent = '2026-09-27';
    }
    const alerts = [];
    const ui = vm.createContext({document, console, alert: message => alerts.push(message),
        window: {location: {pathname: '/', hash: ''}}, send: async () => ({success:true, message:[1,2]})});
    vm.runInContext(source('script.js').replace(/^import .*\n/, ''), ui);
    await ui.loadDashboardOrders(); // Both lists: catches the old undefined weekRange.
    assert.match(ids.get('purchase-orders-week').textContent, /PO #1/);
    const payload = '<img src=x onerror=alert(1)>';
    ui.displaySalesOrdersThisWeek([payload]);
    const link = ids.get('sales-orders-week').children[0].children[0].children[0];
    assert.equal(link.textContent, 'Order #' + payload);
    assert.equal(link.href, 'sales_orders.html#' + encodeURIComponent(payload));
    ui.send = async () => ({success:true, message:{'12':{customer_id:payload,total:42},
        [payload]:{customer_id:payload,total:payload},orders_total:payload}});
    await ui.get_open_orders();
    const report = ids.get('report-container');
    assert.ok(report.textContent.includes(payload));
    let opened;
    ui.show_order_in_report_section = id => { opened = id; };
    report.children[1].children[1].listeners.click();
    assert.equal(opened, '12');
    assert.equal(report.children[2].children[1].tag, '#text');
    const previousReport = report.textContent;
    ui.send = async () => ({success:false,message:'HTTP failure'});
    await ui.get_open_orders();
    assert.equal(report.textContent, previousReport);
    await ui.loadDashboardOrders();
    assert.equal(ids.get('sales-orders-week').textContent, 'HTTP failure');

    let cleared = 0;
    ui.clear_order_screen = () => { cleared++; };
    ui.get_table_data = () => [{item_id:1,qty:2}];
    await ui.submit_order('update', 12, 'test-table');
    assert.equal(cleared, 0, 'failed save must preserve edits');
    ui.send = async () => ({success:true,message:'Updated'});
    await ui.submit_order('update', 12, 'test-table');
    assert.equal(cleared, 1, 'successful update clears the form');
    console.log('PASS: same-origin requests, errors, no automatic retry, safe rendering, dashboard, failed-save preservation');
})().catch(error => { console.error(error); process.exitCode = 1; });
