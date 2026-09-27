import send from './net.js'

/*SET ACTIVE NAVIGATION LINK*/
async function setActiveNavLink() {
	const currentPath = window.location.pathname;

	if(currentPath.includes("sales_order")){
		const order_id = window.location.hash.substring(1)
		if(order_id){
			let response = await send(null,"GET",`sales_orders/${order_id}`);
	if (!response.success) { alert(response.message); return; }
			if(response == undefined || response == null){
				alert(`could not fetch order ${order_id} from the server.`);
				return;

			}
			render_edit_order();
			var input = document.getElementById('edit-order-id');
			input.removeEventListener('focus',get_orders);
			input.value = order_id;
			var d = document.getElementById("edit-order-menu");
			draw_edit_order_table(response,d,null,order_id);
			input.addEventListener('focus',get_orders);
			var cust = document.getElementById('cust-id');
			scroll_down(cust,450);
		}
		//TODO: 
		//	-1) check if there is data in the form
		//	-2) ask user if they want to save the order, o if they want to lose the data. 
		localStorage.removeItem('customer_order');
		localStorage.removeItem('edit_order_data');
		window.show_order_in_report_section = show_order_in_report_section;
	}

	const navLinks = document.querySelectorAll('.sidenav a');
	
	navLinks.forEach(link => {
		link.classList.remove('active');
		const linkPath = link.getAttribute('href');
		
		// Check if current path matches the link
		if (currentPath.includes(linkPath) || 
			(linkPath === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html')))) {
			link.classList.add('active');
		}
	});
}

// Keyboard Navigation
function setupKeyboardNavigation() {
	document.addEventListener('keydown', function(event) {
		// Only trigger if not typing in an input field
		if (event.target.tagName === 'INPUT' || 
		    event.target.tagName === 'TEXTAREA' || 
		    event.target.isContentEditable) {
			if(event.key === 'Escape'){
				document.activeElement.blur();
			}
			return;
		}

		// Prevent default only for our shortcut keys
		const key = event.key;
		let targetUrl = null;

		switch(key) {
			case '1':
				targetUrl = 'sales_orders.html';
				break;
			case '2':
				targetUrl = 'purchase_orders.html';
				break;
			case '3':
				targetUrl = 'account_receivable.html';
				break;
			case '4':
				targetUrl = 'account_payable.html';
				break;
			case '5':
				targetUrl = 'inventory.html';
				break;
			case '6':
				targetUrl = 'general_ledger.html';
				break;
			case '7':
				targetUrl = 'customers.html';
				break;
			default:
				return; // Not our shortcut, do nothing
		}

		if (targetUrl) {
			event.preventDefault();
			window.location.href = targetUrl;
		}
	});
}

// Settings Modal Functions
function initSettings() {
	var settingsLink = document.getElementById('settings-link');
	var settingsModal = document.getElementById('settings-modal');
	var settingsClose = document.getElementById('settings-close');
	
	if (settingsLink) {
		settingsLink.addEventListener('click', function(e) {
			e.preventDefault();
			openSettingsModal();
		});
	}
	
	if (settingsClose) {
		settingsClose.addEventListener('click', closeSettingsModal);
	}
	
	// Close modal when clicking outside
	if (settingsModal) {
		settingsModal.addEventListener('click', function(e) {
			if (e.target === settingsModal) {
				closeSettingsModal();
			}
		});
	}
	
	// Load saved theme
	loadTheme();
	
	// Setup theme selectors
	setupThemeSelectors();
}

function openSettingsModal() {
	var modal = document.getElementById('settings-modal');
	if (modal) {
		modal.classList.add('open');
		document.body.style.overflow = 'hidden';
	}
}

function closeSettingsModal() {
	var modal = document.getElementById('settings-modal');
	if (modal) {
		modal.classList.remove('open');
		document.body.style.overflow = '';
	}
}

function setupThemeSelectors() {
	var themeOptions = document.querySelectorAll('.theme-option');
	themeOptions.forEach(option => {
		option.addEventListener('click', function() {
			var theme = this.getAttribute('data-theme');
			setTheme(theme);
			
			// Update active state
			themeOptions.forEach(opt => opt.classList.remove('active'));
			this.classList.add('active');
		});
	});
}

function setTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme);
	localStorage.setItem('bsm-theme', theme);
}

function loadTheme() {
	var savedTheme = localStorage.getItem('bsm-theme') || 'light';
	setTheme(savedTheme);
	
	// Update active theme option in modal
	setTimeout(function() {
		var activeOption = document.querySelector(`.theme-option[data-theme="${savedTheme}"]`);
		if (activeOption) {
			document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
			activeOption.classList.add('active');
		}
	}, 100);
}

async function loadDashboardOrders() {
    for (const [resource, id, render] of [
        ['reports/sales_orders_week', 'sales-orders-week', displaySalesOrdersThisWeek],
        ['purchase_orders', 'purchase-orders-week', displayPurchaseOrdersThisWeek]
    ]) {
        const response = await send(null, 'GET', resource);
        if (!response.success) {
            document.getElementById(id).textContent = response.message;
            continue;
        }
        const orders = response.message;
        if (typeof orders === 'string' && orders.includes('there are no orders')) render([]);
        else if (Array.isArray(orders)) render(orders);
        else document.getElementById(id).textContent = 'Invalid order list returned by server.';
    }
}

function displayOrderList(orders, id, sales) {
    const container = document.getElementById(id);
    container.replaceChildren();
    if (!orders.length) {
        container.textContent = sales ? 'No sales orders to ship this week.' : 'No purchase orders to receive.';
        return;
    }
    const list = document.createElement('div');
    list.className = 'dashboard-orders-list';
    for (const orderId of (sales ? orders : orders.slice(0, 10))) {
        const row = document.createElement('div');
        row.className = 'dashboard-order-item';
        const link = document.createElement('a');
        link.textContent = `${sales ? 'Order #' : 'PO #'}${orderId}`;
        link.href = sales ? `sales_orders.html#${encodeURIComponent(orderId)}` : 'purchase_orders.html';
        row.appendChild(link);
        list.appendChild(row);
    }
    if (!sales && orders.length > 10) {
        const more = document.createElement('p');
        more.textContent = `And ${orders.length - 10} more orders...`;
        list.appendChild(more);
    }
    container.appendChild(list);
}

function displaySalesOrdersThisWeek(orders) {
    displayOrderList(orders, 'sales-orders-week', true);
}

function displayPurchaseOrdersThisWeek(orders) {
    displayOrderList(orders, 'purchase-orders-week', false);
}

// Set active link and load menu on page load
document.addEventListener('DOMContentLoaded', function() {
	setActiveNavLink();
	setupKeyboardNavigation();
	initSettings();
	
	/*LOAD MENU*/
	const page = window.location.pathname;

	if(page.includes("customer")){
		draw_customer_menu();
	}else if(page.includes("sales_orders")){
		draw_sales_order_menu();
	}else if(page.includes("inventory")){
		draw_inventory_menu();
	}
	
	// Load dashboard data if on index page
	if (page.includes("index") || page.endsWith("/") || page === "") {
		loadDashboardOrders();
	}
});

function erase_main_menu(){
	var btn = document.getElementById("sales_order_menu");
	var btn2 = document.getElementById("customer_menu");
	btn.remove();
	btn2.remove();
}

function draw_inventory_menu(){
	var new_item = document.getElementById("new-item");
	var edit_item = document.getElementById("edit-item");

	new_item.addEventListener("click",render_new_item);
	edit_item.addEventListener("click",render_edit_item);
}

function draw_customer_menu(){

	var new_customer = document.getElementById("new-cust");
	var edit_customer = document.getElementById("edit-cust");
	
	new_customer.addEventListener("click",render_new_customer);
	edit_customer.addEventListener("click",render_edit_customer);
}

function draw_sales_order_menu(){

	var insert_new_order = document.getElementById("new-order");
	var edit_order = document.getElementById("edit-order");
	var report = document.getElementById("report-order");

	insert_new_order.addEventListener("click",render_new_order);
	edit_order.addEventListener("click",render_edit_order);
	report.addEventListener("click",render_report_order);
}


function create_table(row,column_name,id_value){
	var table  = document.createElement("table");
	var t_body = document.createElement("tbody");
	for(let i = 0; i < 2; i++){
		var r = document.createElement("tr");
		/* table header */
		if(i == 0){
			for(let j = 0; j < column_name.length; j++){
				var cell = document.createElement("th");		
				cell.textContent = `${column_name[j]}`;
				r.appendChild(cell);
			}
		}else{
			// Create first data row using the same helper function as add_line_to_order
			for(let k = 0; k < column_name.length;k++){
				var cell = create_table_cell(column_name[k], id_value, row,i,id_value === "edit-order-table" ? false:true);
				r.appendChild(cell);
			}
		}
		
		t_body.appendChild(r);
	}

	table.appendChild(t_body);
	table.setAttribute("id",id_value);

	return table;			
}

var dropdown = null;
function clearDropdown() {
	if (dropdown) {
		dropdown.remove();
		dropdown = null;
	}
}

/*
 * The function check_input() was generated by GPT initially.
 * */

let orders_list;
let customers_list;
let items_list;
function check_input(event){ 
	var cust = false;
	var s_ord = false;
	var items = false;
	
	var input = event.target;
	var page = document.URL;
	if(page.includes('sales_orders')){
		cust = event.target.id === "cust-id";
		s_ord = event.target.id === "edit-order-id";
		items = event.target.id.includes('sales-order-item');
	}else if(page.includes('customers')){
		cust = true;
	}

	const value = input.value;
	clearDropdown();

	if (!value) return;

	let matched;
	if(cust){
		matched = customers_list.filter((customer) => customer.toLowerCase().includes(value.toLowerCase()));
	}else if(s_ord){
		matched = orders_list.filter(order =>order.toString().includes(value)).slice(0, 20);
	}else if(items){
		matched = items_list.filter((item) => item.toLowerCase().includes(value.toLowerCase()));
	}

	if (matched.length === 0) return;

	dropdown = document.createElement("div");
	dropdown.className = "dropdown";
	dropdown.setAttribute("style", `
                position: absolute;
                width: ${input.offsetWidth}px;
	`);

	const inputRect = input.getBoundingClientRect();
	dropdown.style.left = inputRect.left + window.scrollX + "px";
	dropdown.style.top = inputRect.bottom + window.scrollY + "px";

	if(s_ord){
		matched.forEach(order => {
			const option = document.createElement("div");
			option.textContent = order;
			option.className = "dropdown-option";

			option.addEventListener("click", async () => {
				input.value = order;
				clearDropdown();
				/*this fetch the order selected from the server*/
				let response = await send(null,"GET",`sales_orders/${order}`);
	if (!response.success) { alert(response.message); return; }

				/*if there is a table already, destroy it and make a new one */
				/*create the order form populated with the order sales from the back end selected*/
				if(response.message == undefined){
					alert("error in receving json object");
					return;
				}else if(response.message === "there are no orders"){
					alert("there are no orders");
					return ;
				}			
				var d = document.getElementById("edit-order-menu");

				//var br = document.createElement("br");
				//d.appendChild(br);

				console.log(JSON.stringify(response.message));
				localStorage.setItem('edit_order_data',JSON.stringify(response.message));
				var el = d.querySelector("#cust-id");
				if(el != null){/*the order table already exist*/

					if(response.message.sales_orders_head.customer_id != undefined){
						el.value = response.message.sales_orders_head.customer_id;
					}else{
						el.value = "";
					}

					var price_lvl = d.querySelector("#price-level");
					if(response.message.sales_orders_head.price_level_id != undefined){
						price_lvl.value = response.message.sales_orders_head.price_level_id;
					}else{
						price_lvl.value = "";
					}

					var date = d.querySelector("#date");
					if(date == null){
						date = document.createElement("label");
						date.setAttribute("id","date");
						date.setAttribute("style","font-size:24px;");
						date.textContent = response.message.sales_orders_head.date;	
						d.appendChild(date);
					}else{

						if(response.message.sales_orders_head.date != undefined){
							date.textContent = response.message.sales_orders_head.date;
						}
					}

					var edit = d.querySelector("#edit");
					if(edit == null){
						var edit = document.createElement("button");
						edit.textContent = "Edit";
						edit.setAttribute("id","edit");
						edit.setAttribute("style","font-size:18px;margin-right:500px;");
						edit.addEventListener("click",function(event){
							submit_order("update",`${order}`,"edit-order-table");
						}); 
						d.insertBefore(edit,date);
					}else{
						edit.addEventListener("click",function(event){
							submit_order("update",`${order}`,"edit-order-table");
						}); 
					}

					var tbl = document.getElementById("edit-order-table");
					var lines = Number(response.message.sales_orders_head.lines_nr);	

					console.log(tbl.rows.length);
					if((tbl.rows.length -1) < lines){
						for(let i = 1;i <= lines; i++){
							add_line_to_order(null,"edit-order-table");
						}
					}else if((tbl.rows.length - 1) > lines){
						for(let i = tbl.rows.length -1; i > lines; --i){
							tbl.deleteRow(i);
						}
						

					}
					var rows = tbl.rows;

					var sum = 0;
					for(let i = 1;i <= lines; i++){
						var access_line_name = `line_${i}`;


						Array.from(rows[i].children).forEach((cell,index)=>{
							if(index == 0){
								if(response.message.sales_orders_lines[access_line_name].item_id != undefined){
									cell.children[0].value = response.message
										.sales_orders_lines[access_line_name].item_id;
								}else{
									cell.children[0].value ="";

								}
							}
							if(index == 1){
								if(response.message.sales_orders_lines[access_line_name].uom != undefined){
									cell.children[0].value = response.message
										.sales_orders_lines[access_line_name].uom;
								}else{
									cell.children[0].value = "";
								}
							}
							Array.from(cell.children).forEach(child =>{
								if(child.classList.contains("tot")) {
									child.textContent = response.message
										.sales_orders_lines[access_line_name].total;
									sum += Number(response.message.sales_orders_lines[access_line_name].total);
								}
								if(child.classList.contains("qty")) {
									child.value = response.message
										.sales_orders_lines[access_line_name].qty;
								}
								if(child.classList.contains("disc")) {
									if(response.message
										.sales_orders_lines[access_line_name]
										.disc == undefined){
										child.value = 0.00;
									}else{
										child.value = response.message
											.sales_orders_lines[access_line_name].disc;
									}
								}

								if(child.classList.contains("price")) {
									child.value = response.message
										.sales_orders_lines[access_line_name].unit_price;
								}

								if(child.classList.contains("rdate")) {
									child.value = response.message
										.sales_orders_lines[access_line_name].request_date;
								}

							});
						});

					}

					/* clean tbl*/
					for(let i = lines; i < rows.length; i++ ){
						if(i == lines){
							continue;
						}
						tbl.deleteRow(i);
					}
					var ord_table_tot = document.getElementById("order-total-lbl");
					if(ord_table_tot){
						var output_parts  = ord_table_tot.textContent.split("$ ");
						ord_table_tot.textContent = output_parts[0] + "$ " + Number(sum).toFixed(2);

					}
					return;
				}
				draw_edit_order_table(response,d,null,order);
			});
			dropdown.appendChild(option);
		});
	}else if(cust){
		matched.forEach(customer => {
			const option = document.createElement("div");
			option.textContent = customer;
			option.className = "dropdown-option";

			option.addEventListener("click",async () =>{
				input = document.getElementById("cust-id")
				input.value = customer;
				clearDropdown();



				var root = document.getElementById("root-edit-customer");
				if(root){
					/*get the customer selected by the users*/
					let response = await send(null,"GET",`customers/${customer}`);
	if (!response.success) { alert(response.message); return; }
					/*TODO: remove this when you ready*/
					console.log(JSON.stringify(response.message));
						
					/*create layout customer*/
					// Basic Information Section
					var basicSection = document.createElement("div");
					basicSection.className = "form-section";
					var basicTitle = document.createElement("h3");
					basicTitle.className = "section-title";
					basicTitle.textContent = "Basic Information";
					basicSection.appendChild(basicTitle);


					// Basic Information Section
					var basicSection = document.createElement("div");
					basicSection.className = "form-section";
					var basicTitle = document.createElement("h3");
					basicTitle.className = "section-title";
					basicTitle.textContent = "Basic Information";
					basicSection.appendChild(basicTitle);

					var basicGrid = document.createElement("div");
					basicGrid.className = "form-grid";


					var c_name_group = document.createElement("div");
					c_name_group.className = "form-group";
					var c_name_lbl = document.createElement("label");
					c_name_lbl.textContent = "Customer Name";
					c_name_lbl.setAttribute("for", "edit-customer-name");
					var c_name_input = document.createElement("input");
					c_name_input.classList.add("input_2px_border");
					c_name_input.setAttribute("id","edit-customer-name");
					c_name_input.setAttribute("type","text");
					c_name_input.setAttribute("autocomplete","off");

					c_name_input.value = response.message.name;
					c_name_group.appendChild(c_name_lbl);
					c_name_group.appendChild(c_name_input);
					basicGrid.appendChild(c_name_group);


					var c_hdq_id_group = document.createElement("div");
					c_hdq_id_group.className = "form-group";
					var c_hdq_id_lbl = document.createElement("label");
					c_hdq_id_lbl.textContent = "Customer Headquarters ID";
					c_hdq_id_lbl.setAttribute("for", "cust-hq-id");
					var c_hdq_id_input = document.createElement("input");
					c_hdq_id_input.classList.add("input_2px_border");
					c_hdq_id_input.setAttribute("id","cust-hq-id");
					c_hdq_id_input.setAttribute("type","text");
					c_hdq_id_input.title = "Use an existing customer if this is just another shipping address";
					c_hdq_id_input.addEventListener("focus",get_customers);
					c_hdq_id_group.appendChild(c_hdq_id_lbl);
					c_hdq_id_group.appendChild(c_hdq_id_input);
					basicGrid.appendChild(c_hdq_id_group);

					var sls_person_group = document.createElement("div");
					sls_person_group.className = "form-group";
					var sls_person_lbl = document.createElement("label");
					sls_person_lbl.textContent = "Sales Person ID";
					sls_person_lbl.setAttribute("for", "edit-sls-person");
					var sls_person_input = document.createElement("input");
					sls_person_input.classList.add("input_2px_border");	
					sls_person_input.setAttribute("id","edit-sls-person");
					sls_person_input.setAttribute("type","text");
					sls_person_input.setAttribute("autocomplete","off");
					sls_person_group.appendChild(sls_person_lbl);
					sls_person_group.appendChild(sls_person_input);
					basicGrid.appendChild(sls_person_group);

					var main_pr_level_group = document.createElement("div");
					main_pr_level_group.className = "form-group";
					var main_pr_level_lbl = document.createElement("label");
					main_pr_level_lbl.textContent = "Main Price Level";
					main_pr_level_lbl.setAttribute("for", "edit-main-pr-level");
					var main_pr_level_input = document.createElement("input");
					main_pr_level_input.classList.add("input_2px_border");	
					main_pr_level_input.setAttribute("id","edit-main-pr-level");
					main_pr_level_input.setAttribute("type","text");
					main_pr_level_input.setAttribute("autocomplete","off");
					main_pr_level_input.title = "If you have configured Price levels you can choose one value, if you want to have a customer that always has a certain type of discount.";
					main_pr_level_group.appendChild(main_pr_level_lbl);
					main_pr_level_group.appendChild(main_pr_level_input);
					basicGrid.appendChild(main_pr_level_group);

					basicSection.appendChild(basicGrid);
					root.appendChild(basicSection);

					// Address Section
					var addressSection = document.createElement("div");
					addressSection.className = "form-section";
					var addressTitle = document.createElement("h3");
					addressTitle.className = "section-title";
					addressTitle.textContent = "Address Information";
					addressSection.appendChild(addressTitle);

					var addressGrid = document.createElement("div");
					addressGrid.className = "form-grid";

					var addr1_group = document.createElement("div");
					addr1_group.className = "form-group";
					addr1_group.style.gridColumn = "1 / -1";
					var addr1_lbl = document.createElement("label");
					addr1_lbl.textContent = "Street Address";
					addr1_lbl.setAttribute("for", "edit-addr1");
					var addr1_input = document.createElement("input");
					addr1_input.classList.add("input_2px_border");	
					addr1_input.setAttribute("id","edit-addr1");
					addr1_input.setAttribute("type","text");
					addr1_input.setAttribute("autocomplete","street-address");
					addr1_input.value = response.message.addr;
					addr1_group.appendChild(addr1_lbl);
					addr1_group.appendChild(addr1_input);
					addressGrid.appendChild(addr1_group);

					var addr2_group = document.createElement("div");
					addr2_group.className = "form-group";
					addr2_group.style.gridColumn = "1 / -1";
					var addr2_lbl = document.createElement("label");
					addr2_lbl.textContent = "Additional Address Info (Optional)";
					addr2_lbl.setAttribute("for", "edit-addr2");
					var addr2_input = document.createElement("input");
					addr2_input.placeholder = "Apartment, suite, unit, etc.";
					addr2_input.classList.add("input_2px_border");
					addr2_input.setAttribute("id","edit-addr2");
					addr2_input.setAttribute("type","text");
					addr2_input.setAttribute("autocomplete","address-line2");
					addr2_group.appendChild(addr2_lbl);
					addr2_group.appendChild(addr2_input);
					addressGrid.appendChild(addr2_group);

					var csz = response.message.csz.split(" ");
					var city_group = document.createElement("div");
					city_group.className = "form-group";
					var city_lbl = document.createElement("label");
					city_lbl.textContent = "City";
					city_lbl.setAttribute("for", "edit-city");
					var city_input = document.createElement("input");
					city_input.setAttribute("id","edit-city");
					city_input.setAttribute("type","text");
					city_input.classList.add("input_2px_border");
					city_input.setAttribute("autocomplete","address-level2");
					city_input.value = csz[0];
					city_group.appendChild(city_lbl);
					city_group.appendChild(city_input);
					addressGrid.appendChild(city_group);

					var state_group = document.createElement("div");
					state_group.className = "form-group";
					var state_lbl = document.createElement("label");
					state_lbl.textContent = "State/Province";
					state_lbl.setAttribute("for", "edit-state");
					var state_input = document.createElement("input");
					state_input.setAttribute("id","edit-state");
					state_input.setAttribute("type","text");
					state_input.classList.add("input_2px_border");
					state_input.setAttribute("autocomplete","address-level1");
					state_input.value = csz[1];
					state_group.appendChild(state_lbl);
					state_group.appendChild(state_input);
					addressGrid.appendChild(state_group);

					var zipcode_group = document.createElement("div");
					zipcode_group.className = "form-group";
					var zipcode_lbl = document.createElement("label");
					zipcode_lbl.textContent = "Zip/Postal Code";
					zipcode_lbl.setAttribute("for", "edit-zipcode");
					var zipcode_input = document.createElement("input");
					zipcode_input.setAttribute("id","edit-zipcode");
					zipcode_input.setAttribute("type","text");
					zipcode_input.classList.add("input_2px_border");
					zipcode_input.setAttribute("autocomplete","postal-code");
					zipcode_input.value = csz[2];
					zipcode_group.appendChild(zipcode_lbl);
					zipcode_group.appendChild(zipcode_input);
					addressGrid.appendChild(zipcode_group);

					var country_group = document.createElement("div");
					country_group.className = "form-group";
					var country_lbl = document.createElement("label");
					country_lbl.textContent = "Country";
					country_lbl.setAttribute("for", "edit-country");
					var country_input = document.createElement("input");
					country_input.setAttribute("id","edit-country");
					country_input.setAttribute("type","text");
					country_input.classList.add("input_2px_border");
					country_input.setAttribute("autocomplete","country");
					country_group.appendChild(country_lbl);
					country_group.appendChild(country_input);
					addressGrid.appendChild(country_group);

					addressSection.appendChild(addressGrid);
					root.appendChild(addressSection);
				}else{
					/*Here you are in the new sales order menu*/

					/*get the customer selected by the users*/
					let response = await send(null,"GET",`sales_new_order_customers/${customer}`);
	if (!response.success) { alert(response.message); return; }

					/*save data in the browser storage*/
					localStorage.setItem('customer_order',JSON.stringify(response.message));

					//TODO: prepopulate the form if the response contain the fields
					if(response.message.price_level_id != undefined){
						var input = document.getElementById("price-level");
						if(input){
							input.value = response.message.price_level_id;
						}
						var elements = document.querySelectorAll('[id*="order-disc-"]');
						elements.forEach((e) =>{
							if(e.tagName === 'INPUT'){
								if(e.tagName.value !== "0"){
									if(response.message.percentage != undefined)
										e.value = response.message.percentage;
								}
							}
						});
					}
					/*
					if(response.message.on_credit_hold != undefined){
						if(response.message.on_credit_hold == 1){
							alert("client is on credit hold, see your manager");
							clear_order_screen();
							return;
						}
					}
					*/
				}
			});
			dropdown.appendChild(option);
		});
	}else if(items){
		matched.forEach(item => {
			const option = document.createElement("div");
			option.textContent = item;
			option.className = "dropdown-option";

			option.addEventListener("click", async () => {
				input.value = item;
				clearDropdown();

				/*get the item selected by the users*/
				let response = await send(null,"GET",`items/${item}`);
	if (!response.success) { alert(response.message); return; }

				console.log(JSON.stringify(response.message))
				/*populate the table price and uom*/
				
				const id_row = input.id;
				const number = id_row.match(/\d+/);
				console.log(number);
				if(number){
					var price = document.getElementById(`price-${number}`);
					price.value = Number(response.message.unit_price);
					var uom = document.getElementById(`uom-${number}`); 
					uom.value = response.message.uom;
				}else{
					var price = document.getElementById("price");
					price.value = Number(response.message.unit_price);
					var uom = document.getElementById("uom"); 
					uom.value = response.message.uom;
				}


			});
			dropdown.appendChild(option);
		});
	}
	document.body.appendChild(dropdown);

	// Close dropdown if clicking outside
	document.addEventListener("click", (e) => {
		if (e.target !== input) clearDropdown();
	});
}

async function get_orders(){
	const response = await send(null,"GET","sales_orders");
	if (!response.success) { alert(response.message); return; }
	if(typeof response.message === "string" && response.message.includes("there are no orders")){
		alert(response.message);		
		clear_order_screen();
		return;
	}
	orders_list = response.message;


	var input = document.getElementById("edit-order-id");
	input.removeEventListener("focus",get_orders);
	input.addEventListener("input",check_input);
}


async function get_items(event){
	const response = await send(null,"GET","items");
	if (!response.success) { alert(response.message); return; }
	items_list = response.message;

	console.log(items_list);
	var input = event.target;
	input.removeEventListener("focus",get_items);
	input.addEventListener("input",check_input);
}

async function renderOrderReport(resource, title, clickable) {
    const response = await send(null, 'GET', resource);
    if (!response.success) { alert(response.message); return; }
    const data = response.message;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        alert(typeof data === 'string' ? data : 'Invalid report returned by server.');
        return;
    }
    let container = document.getElementById('report-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'report-container';
        container.className = 'report';
        document.getElementById('report-order-menu').appendChild(container);
    }
    container.replaceChildren();
    const heading = document.createElement('h4');
    heading.textContent = title;
    container.appendChild(heading);
    for (const [key, order] of Object.entries(data)) {
        if (key === 'orders_total' || !order || typeof order !== 'object') continue;
        const row = document.createElement('div');
        row.appendChild(document.createTextNode('order nr '));
        if (clickable && /^\d+$/.test(key)) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'clickable-word';
            button.textContent = key;
            button.addEventListener('click', () => show_order_in_report_section(key));
            row.appendChild(button);
        } else row.appendChild(document.createTextNode(key));
        row.appendChild(document.createTextNode(`, for customer ${order.customer_id}, total: ${order.total}`));
        container.appendChild(row);
    }
    const total = document.createElement('p');
    total.textContent = `Total ${title.toLowerCase()}: ${data.orders_total ?? ''}`;
    container.appendChild(total);
}

async function get_overdue_orders() {
    return renderOrderReport('reports/overdue_orders', 'Overdue orders', false);
}

async function get_open_orders() {
    return renderOrderReport('reports/open_orders', 'Open orders', true);
}
async function get_customers(event){
	const response = await send(null,"GET","customers");
	if (!response.success) { alert(response.message); return; }
	customers_list = response.message;

	console.log(customers_list);
	var input = document.getElementById("cust-id");
	input.removeEventListener("focus",get_customers);
	input.addEventListener("input",check_input);
}

function render_edit_order(){

	var root = document.getElementById("hidden-edit-order-menu");
	if(root){
		/*make it visibile*/
		var bt = document.getElementById("edit-order");
		bt.setAttribute("id","back");
		bt.textContent = "Back";
		bt.removeEventListener("click",render_edit_order);
		bt.addEventListener("click",clear_order_screen);

		var bt2 = document.getElementById("new-order");
		bt2.style.display = "none";

		var btn3 = document.getElementById("report-order");
		btn3.style.display = "none";

		root.setAttribute("id","edit-order-menu");
		root.style.display = null;
		return; 
	}

	var btn = document.getElementById("edit-order");
	btn.textContent = "Back";
	btn.setAttribute("id","back");
	btn.removeEventListener("click",render_edit_order);
	btn.addEventListener("click",clear_order_screen);

	var btn2 = document.getElementById("new-order");
	btn2.style.display = "none";

	var btn3 = document.getElementById("report-order");
	btn3.style.display = "none";

	// Get the main container
	var mainContainer = document.querySelector('main') || document.getElementById('root');
	if (!mainContainer) {
		mainContainer = document.body;
	}

	// Create card container
	const d = document.createElement("div");
	d.setAttribute("id","edit-order-menu");
	d.classList.add("card", "fade-in");

	// Form Header
	var formHeader = document.createElement("div");
	formHeader.className = "card-header";
	formHeader.textContent = "Edit Sales Order";
	d.appendChild(formHeader);

	// Order Number Section
	var orderInfoSection = document.createElement("div");
	orderInfoSection.className = "form-section";

	var orderInfoGrid = document.createElement("div");
	orderInfoGrid.className = "form-grid";

	// Order Number
	var orderGroup = document.createElement("div");
	orderGroup.className = "form-group";
	var o_label = document.createElement("label");
	o_label.textContent = "Order Number";
	o_label.setAttribute("for","edit-order-id");
	orderGroup.appendChild(o_label);

	var input_order = document.createElement("input");
	input_order.addEventListener("focus",get_orders);
	input_order.className = "input_2px_border";
	input_order.setAttribute("id","edit-order-id");
	input_order.setAttribute("type","text");
	orderGroup.appendChild(input_order);
	orderInfoGrid.appendChild(orderGroup);

	orderInfoSection.appendChild(orderInfoGrid);
	d.appendChild(orderInfoSection);

	// Append to main container
	mainContainer.appendChild(d);
}

function show_tax_authority()
{
	var ch_b = document.getElementById('tax');
	var tax_group = ch_b.closest('.form-group');
	if(ch_b.checked == true){
		// Check if tax input already exists
		if(document.getElementById("tax-input")) return;

		var tax_aut_group = document.createElement("div");
		tax_aut_group.className = "form-group";
		tax_aut_group.setAttribute("id","tax-input-group");
		var tax_aut_lbl = document.createElement("label");
		tax_aut_lbl.textContent = "Tax Authority";
		tax_aut_lbl.setAttribute("for","tax-input");
		tax_aut_lbl.setAttribute("id","tax-lbl");
		var tax_aut_input = document.createElement("input");
		tax_aut_input.classList.add("input_2px_border");
		tax_aut_input.setAttribute("id","tax-input");
		tax_aut_input.setAttribute("type","text");
		tax_aut_input.setAttribute("autocomplete","off");
		tax_aut_group.appendChild(tax_aut_lbl);
		tax_aut_group.appendChild(tax_aut_input);
		tax_group.after(tax_aut_group);
	}else{
		var tax_aut_group = document.getElementById("tax-input-group");
		if(tax_aut_group){
			tax_aut_group.remove();
		}
	}
}

function render_edit_item(){
	/*TODO*/

}
function render_new_item(){
	/*get root div*/
	var root = document.getElementById("hidden-root-new-item");
	const nw_item_btn = document.getElementById("new-item");
	nw_item_btn.textContent = "Back";
	nw_item_btn.setAttribute("id","back");
	nw_item_btn.removeEventListener("click",render_new_item);
	nw_item_btn.addEventListener("click",clear_order_screen);
	const edit_cust_btn = document.getElementById("edit-item");
	edit_cust_btn.style.display = "none";
	root.style.display = null;
	root.setAttribute("id","root-new-item");
	const save_item = document.getElementById("submit-item");
	save_item.addEventListener("click",submit_item)
}
function render_new_customer(){

	/*get the root div*/
	var root = document.getElementById("hidden-root-new-customer");
	if(root){
		/*show the hidden new customer menu*/
		const nw_cust_btn = document.getElementById("new-cust");
		nw_cust_btn.textContent = "Back";
		nw_cust_btn.setAttribute("id","back");
		nw_cust_btn.removeEventListener("click",render_new_customer);
		nw_cust_btn.addEventListener("click",clear_order_screen);

		const edit_cust_btn = document.getElementById("edit-cust");
		edit_cust_btn.style.display = "none";
		root.style.display = null;
		root.setAttribute("id","root-new-customer");
		return;
	}

	const sb_btn = document.createElement("button");
	sb_btn.addEventListener("click",submit_new_customer);
	sb_btn.classList.add("button");
	sb_btn.textContent = "Save Customer";

	const nw_cust_btn = document.getElementById("new-cust");
	nw_cust_btn.textContent = "Back";
	nw_cust_btn.setAttribute("id","back");
	nw_cust_btn.removeEventListener("click",render_new_customer);
	nw_cust_btn.addEventListener("click",clear_order_screen);
	const edit_cust_btn = document.getElementById("edit-cust");
	edit_cust_btn.style.display = "none";

	// Get the main container
	var mainContainer = document.querySelector('main') || document.getElementById('root');
	if (!mainContainer) {
		mainContainer = document.body;
	}

	const d = document.createElement("div");
	d.setAttribute("id","root-new-customer");
	d.classList.add("card", "fade-in");

	// Form Header
	var formHeader = document.createElement("div");
	formHeader.className = "card-header";
	formHeader.textContent = "New Customer Information";
	d.appendChild(formHeader);

	// Basic Information Section
	var basicSection = document.createElement("div");
	basicSection.className = "form-section";
	var basicTitle = document.createElement("h3");
	basicTitle.className = "section-title";
	basicTitle.textContent = "Basic Information";
	basicSection.appendChild(basicTitle);

	var basicGrid = document.createElement("div");
	basicGrid.className = "form-grid";

	/*create layout customer*/
	var c_name_group = document.createElement("div");
	c_name_group.className = "form-group";
	var c_name_lbl = document.createElement("label");
	c_name_lbl.textContent = "Customer Name";
	c_name_lbl.setAttribute("for", "new-customer-name");
	var c_name_input = document.createElement("input");
	c_name_input.classList.add("input_2px_border");
	c_name_input.setAttribute("id","new-customer-name");
	c_name_input.setAttribute("type","text");
	c_name_input.setAttribute("autocomplete","off");
	c_name_group.appendChild(c_name_lbl);
	c_name_group.appendChild(c_name_input);
	basicGrid.appendChild(c_name_group);

	var c_hdq_id_group = document.createElement("div");
	c_hdq_id_group.className = "form-group";
	var c_hdq_id_lbl = document.createElement("label");
	c_hdq_id_lbl.textContent = "Customer Headquarters ID";
	c_hdq_id_lbl.setAttribute("for", "cust-hd-id");
	var c_hdq_id_input = document.createElement("input");
	c_hdq_id_input.classList.add("input_2px_border");
	c_hdq_id_input.setAttribute("id","cust-hd-id");
	c_hdq_id_input.setAttribute("type","text");
	c_hdq_id_input.title = "Use an existing customer if this is just another shipping address";
	c_hdq_id_group.appendChild(c_hdq_id_lbl);
	c_hdq_id_group.appendChild(c_hdq_id_input);
	basicGrid.appendChild(c_hdq_id_group);

	var sls_person_group = document.createElement("div");
	sls_person_group.className = "form-group";
	var sls_person_lbl = document.createElement("label");
	sls_person_lbl.textContent = "Sales Person ID";
	sls_person_lbl.setAttribute("for", "sls-person");
	var sls_person_input = document.createElement("input");
	sls_person_input.classList.add("input_2px_border");	
	sls_person_input.setAttribute("id","sls-person");
	sls_person_input.setAttribute("type","text");
	sls_person_input.setAttribute("autocomplete","off");
	sls_person_group.appendChild(sls_person_lbl);
	sls_person_group.appendChild(sls_person_input);
	basicGrid.appendChild(sls_person_group);

	var main_pr_level_group = document.createElement("div");
	main_pr_level_group.className = "form-group";
	var main_pr_level_lbl = document.createElement("label");
	main_pr_level_lbl.textContent = "Main Price Level";
	main_pr_level_lbl.setAttribute("for", "main-pr-level");
	var main_pr_level_input = document.createElement("input");
	main_pr_level_input.classList.add("input_2px_border");	
	main_pr_level_input.setAttribute("id","main-pr-level");
	main_pr_level_input.setAttribute("type","text");
	main_pr_level_input.setAttribute("autocomplete","off");
	main_pr_level_input.title = "If you have configured Price levels you can choose one value, if you want to have a customer that always has a certain type of discount.";
	main_pr_level_group.appendChild(main_pr_level_lbl);
	main_pr_level_group.appendChild(main_pr_level_input);
	basicGrid.appendChild(main_pr_level_group);

	basicSection.appendChild(basicGrid);
	d.appendChild(basicSection);

	// Address Section
	var addressSection = document.createElement("div");
	addressSection.className = "form-section";
	var addressTitle = document.createElement("h3");
	addressTitle.className = "section-title";
	addressTitle.textContent = "Address Information";
	addressSection.appendChild(addressTitle);

	var addressGrid = document.createElement("div");
	addressGrid.className = "form-grid";

	var addr1_group = document.createElement("div");
	addr1_group.className = "form-group";
	addr1_group.style.gridColumn = "1 / -1";
	var addr1_lbl = document.createElement("label");
	addr1_lbl.textContent = "Street Address";
	addr1_lbl.setAttribute("for", "addr1");
	var addr1_input = document.createElement("input");
	addr1_input.classList.add("input_2px_border");	
	addr1_input.setAttribute("id","addr1");
	addr1_input.setAttribute("type","text");
	addr1_input.setAttribute("autocomplete","street-address");
	addr1_group.appendChild(addr1_lbl);
	addr1_group.appendChild(addr1_input);
	addressGrid.appendChild(addr1_group);

	var addr2_group = document.createElement("div");
	addr2_group.className = "form-group";
	addr2_group.style.gridColumn = "1 / -1";
	var addr2_lbl = document.createElement("label");
	addr2_lbl.textContent = "Additional Address Info (Optional)";
	addr2_lbl.setAttribute("for", "addr2");
	var addr2_input = document.createElement("input");
	addr2_input.placeholder = "Apartment, suite, unit, etc.";
	addr2_input.classList.add("input_2px_border");
	addr2_input.setAttribute("id","addr2");
	addr2_input.setAttribute("type","text");
	addr2_input.setAttribute("autocomplete","address-line2");
	addr2_group.appendChild(addr2_lbl);
	addr2_group.appendChild(addr2_input);
	addressGrid.appendChild(addr2_group);

	var city_group = document.createElement("div");
	city_group.className = "form-group";
	var city_lbl = document.createElement("label");
	city_lbl.textContent = "City";
	city_lbl.setAttribute("for", "city");
	var city_input = document.createElement("input");
	city_input.setAttribute("id","city");
	city_input.setAttribute("type","text");
	city_input.classList.add("input_2px_border");
	city_input.setAttribute("autocomplete","address-level2");
	city_group.appendChild(city_lbl);
	city_group.appendChild(city_input);
	addressGrid.appendChild(city_group);

	var state_group = document.createElement("div");
	state_group.className = "form-group";
	var state_lbl = document.createElement("label");
	state_lbl.textContent = "State/Province";
	state_lbl.setAttribute("for", "state");
	var state_input = document.createElement("input");
	state_input.setAttribute("id","state");
	state_input.setAttribute("type","text");
	state_input.classList.add("input_2px_border");
	state_input.setAttribute("autocomplete","address-level1");
	state_group.appendChild(state_lbl);
	state_group.appendChild(state_input);
	addressGrid.appendChild(state_group);

	var zipcode_group = document.createElement("div");
	zipcode_group.className = "form-group";
	var zipcode_lbl = document.createElement("label");
	zipcode_lbl.textContent = "Zip/Postal Code";
	zipcode_lbl.setAttribute("for", "zipcode");
	var zipcode_input = document.createElement("input");
	zipcode_input.setAttribute("id","zipcode");
	zipcode_input.setAttribute("type","text");
	zipcode_input.classList.add("input_2px_border");
	zipcode_input.setAttribute("autocomplete","postal-code");
	zipcode_group.appendChild(zipcode_lbl);
	zipcode_group.appendChild(zipcode_input);
	addressGrid.appendChild(zipcode_group);

	var country_group = document.createElement("div");
	country_group.className = "form-group";
	var country_lbl = document.createElement("label");
	country_lbl.textContent = "Country";
	country_lbl.setAttribute("for", "country");
	var country_input = document.createElement("input");
	country_input.setAttribute("id","country");
	country_input.setAttribute("type","text");
	country_input.classList.add("input_2px_border");
	country_input.setAttribute("autocomplete","country");
	country_group.appendChild(country_lbl);
	country_group.appendChild(country_input);
	addressGrid.appendChild(country_group);

	addressSection.appendChild(addressGrid);
	d.appendChild(addressSection);

	// Contact Information Section
	var contactSection = document.createElement("div");
	contactSection.className = "form-section";
	var contactTitle = document.createElement("h3");
	contactTitle.className = "section-title";
	contactTitle.textContent = "Contact Information";
	contactSection.appendChild(contactTitle);

	var contactGrid = document.createElement("div");
	contactGrid.className = "form-grid";

	var contat_group = document.createElement("div");
	contat_group.className = "form-group";
	var contat_lbl = document.createElement("label");
	contat_lbl.textContent = "Contact Person";
	contat_lbl.setAttribute("for", "contact");
	var contat_input = document.createElement("input");
	contat_input.setAttribute("id","contact");
	contat_input.setAttribute("type","text");
	contat_input.classList.add("input_2px_border");
	contat_input.setAttribute("autocomplete","name");
	contat_group.appendChild(contat_lbl);
	contat_group.appendChild(contat_input);
	contactGrid.appendChild(contat_group);

	var phone_group = document.createElement("div");
	phone_group.className = "form-group";
	var phone_lbl = document.createElement("label");
	phone_lbl.textContent = "Phone";
	phone_lbl.setAttribute("for", "phone");
	var phone_input = document.createElement("input");
	phone_input.setAttribute("id","phone");
	phone_input.setAttribute("type","tel");
	phone_input.classList.add("input_2px_border");
	phone_input.setAttribute("autocomplete","tel");
	phone_group.appendChild(phone_lbl);
	phone_group.appendChild(phone_input);
	contactGrid.appendChild(phone_group);

	var email_group = document.createElement("div");
	email_group.className = "form-group";
	email_group.style.gridColumn = "1 / -1";
	var email_lbl = document.createElement("label");
	email_lbl.textContent = "Email";
	email_lbl.setAttribute("for", "email");
	var email_input = document.createElement("input");
	email_input.setAttribute("id","email");
	email_input.setAttribute("type","email");
	email_input.classList.add("input_2px_border");
	email_input.setAttribute("autocomplete","email");
	email_group.appendChild(email_lbl);
	email_group.appendChild(email_input);
	contactGrid.appendChild(email_group);

	contactSection.appendChild(contactGrid);
	d.appendChild(contactSection);

	// Business Information Section
	var businessSection = document.createElement("div");
	businessSection.className = "form-section";
	var businessTitle = document.createElement("h3");
	businessTitle.className = "section-title";
	businessTitle.textContent = "Business Information";
	businessSection.appendChild(businessTitle);

	var businessGrid = document.createElement("div");
	businessGrid.className = "form-grid";

	var tax_group = document.createElement("div");
	tax_group.className = "form-group";
	tax_group.style.gridColumn = "1 / -1";
	var tax_container = document.createElement("div");
	tax_container.style.display = "flex";
	tax_container.style.alignItems = "center";
	tax_container.style.gap = "var(--spacing-md)";
	var checkbox = document.createElement("input");
	checkbox.setAttribute("id","tax");
	checkbox.setAttribute("type","checkbox");
	checkbox.addEventListener("click",show_tax_authority);	
	checkbox.classList.add("chkbox");
	var is_tax_exempt_lbl = document.createElement("label");
	is_tax_exempt_lbl.setAttribute("for","tax");
	is_tax_exempt_lbl.textContent = "Tax Exempt";
	is_tax_exempt_lbl.style.margin = "0";
	is_tax_exempt_lbl.style.cursor = "pointer";
	tax_container.appendChild(checkbox);
	tax_container.appendChild(is_tax_exempt_lbl);
	tax_group.appendChild(tax_container);
	businessGrid.appendChild(tax_group);

	var warehouse_group = document.createElement("div");
	warehouse_group.className = "form-group";
	var warehouse_lbl = document.createElement("label");
	warehouse_lbl.textContent = "Warehouse";
	warehouse_lbl.setAttribute("for", "warehouse");
	var warehouse_input = document.createElement("input");
	warehouse_input.setAttribute("id","warehouse");
	warehouse_input.setAttribute("type","text");
	warehouse_input.classList.add("input_2px_border");
	warehouse_input.setAttribute("autocomplete","off");
	warehouse_group.appendChild(warehouse_lbl);
	warehouse_group.appendChild(warehouse_input);
	businessGrid.appendChild(warehouse_group);

	var sales_term_group = document.createElement("div");
	sales_term_group.className = "form-group";
	var sales_term_lbl = document.createElement("label");
	sales_term_lbl.textContent = "Sales Terms";
	sales_term_lbl.setAttribute("for", "sale-term");
	var sales_term_input = document.createElement("input");
	sales_term_input.setAttribute("id","sale-term");
	sales_term_input.setAttribute("type","text");
	sales_term_input.classList.add("input_2px_border");
	sales_term_input.setAttribute("autocomplete","off");
	sales_term_group.appendChild(sales_term_lbl);
	sales_term_group.appendChild(sales_term_input);
	businessGrid.appendChild(sales_term_group);

	var credit_limit_group = document.createElement("div");
	credit_limit_group.className = "form-group";
	var credit_limit_lbl = document.createElement("label");
	credit_limit_lbl.textContent = "Credit Limit";
	credit_limit_lbl.setAttribute("for", "credit-limit");
	var credit_limit_input= document.createElement("input");
	credit_limit_input.setAttribute("id","credit-limit");
	credit_limit_input.setAttribute("type","number");
	credit_limit_input.setAttribute("step","0.01");
	credit_limit_input.classList.add("input_2px_border");
	credit_limit_input.setAttribute("autocomplete","off");
	credit_limit_group.appendChild(credit_limit_lbl);
	credit_limit_group.appendChild(credit_limit_input);
	businessGrid.appendChild(credit_limit_group);

	businessSection.appendChild(businessGrid);
	d.appendChild(businessSection);

	// Form Actions
	var formActions = document.createElement("div");
	formActions.className = "form-actions";
	sb_btn.classList.add("success");
	formActions.appendChild(sb_btn);
	d.appendChild(formActions);

	// Append to main container
	mainContainer.appendChild(d);

	// Focus on customer name input and scroll to show the form
	setTimeout(function() {
		var custNameInput = document.getElementById("new-customer-name");
		if (custNameInput) {
			custNameInput.focus();
		}
		// Minimal scroll - only scroll if form is not visible, then adjust slightly
		//var formRect = d.getBoundingClientRect();
		//var isVisible = formRect.top >= 0 && formRect.top < window.innerHeight;

		window.scrollBy({
			top: 350,
			behavior: 'smooth'
		});
	}, 200);
}

function render_edit_customer(){

	var root = document.getElementById("hidden-root-edit-customer");
	if(root){

		/*show the hidden*/
		var bt = document.getElementById("edit-cust");
		bt.setAttribute("id","back");
		bt.textContent = "Back";
		bt.removeEventListener("click",render_edit_customer);
		bt.addEventListener("click",clear_order_screen);

		var bt2 = document.getElementById("new-cust");
		bt2.style.display = "none";

		root.setAttribute("id","root-edit-customer");
		root.style.display = null;
		return; 
	}

	var mainContainer = document.querySelector('main') || document.getElementById('root');
	if(!mainContainer){
		mainContainer = document.body;
	}

	var b = document.getElementById("edit-cust");
	b.setAttribute("id","back");
	b.textContent = "Back";
	b.removeEventListener("click",render_edit_customer);
	b.addEventListener("click",clear_order_screen);

	var b2 = document.getElementById("new-cust");
	b2.style.display = "none";

	// Create card container
	const d = document.createElement("div");
	d.setAttribute("id","root-edit-customer");
	d.classList.add("card", "fade-in");

	// Form Header
	var formHeader = document.createElement("div");
	formHeader.className = "card-header";
	formHeader.textContent = "Edit Customer";
	d.appendChild(formHeader);

	var orderInfoGrid = document.createElement("div");
	orderInfoGrid.className = "form-grid";

	// Customer ID
	var custGroup = document.createElement("div");
	custGroup.className = "form-group";
	var c_label = document.createElement("label");
	c_label.textContent = "Customer ID";
	c_label.setAttribute("for","cust-id");
	custGroup.appendChild(c_label);

	var input_customer = document.createElement("input");
	input_customer.className = "input_2px_border";
	input_customer.setAttribute("id","cust-id");
	input_customer.setAttribute("type","text");
	input_customer.setAttribute("title","Customer identification in the system");
	input_customer.addEventListener("focus",get_customers);
	custGroup.appendChild(input_customer);
	orderInfoGrid.appendChild(custGroup);

	d.appendChild(orderInfoGrid);
	mainContainer.appendChild(d);
}

function render_report_order(){
	var root = document.getElementById("hidden-report-order-menu");
	if(root){
		var btn = document.getElementById("report-order");
		btn.textContent = "Back";
		btn.setAttribute("id","back");
		btn.removeEventListener("click",render_report_order);
		btn.addEventListener("click",clear_order_screen);
		var btn2 = document.getElementById("edit-order");
		btn2.style.display = "none";
		var btn3 = document.getElementById("new-order");
		btn3.style.display = "none";

		root.style.display = null;
		root.setAttribute("id","report-order-menu");
		return;
	}



	// Get the main container
	var mainContainer = document.querySelector('main') || document.getElementById('root');
	if (!mainContainer) {
		mainContainer = document.body;
	}

	// Create card container
	const d = document.createElement("div");
	d.setAttribute("id","report-order-menu");
	d.classList.add("card", "fade-in");

	// Form Header
	var formHeader = document.createElement("div");
	formHeader.className = "card-header";
	formHeader.textContent = "Sales Order Reports";
	d.appendChild(formHeader);

	// Report btn Section
	var orderInfoSection = document.createElement("div");
	orderInfoSection.className = "form-section";

	var orderInfoGrid = document.createElement("div");
	orderInfoGrid.className = "form-grid";

	orderInfoGrid.style.display = "flex";
	orderInfoGrid.style.justifyContent = "space-between";
	orderInfoGrid.style.alignItems = "center";
	orderInfoGrid.style.marginBottom = "var(--spacing-md)";

	var list_open_order = document.createElement("button");
	list_open_order.textContent = "Get Open Orders";
	list_open_order.className = "button";
	list_open_order.addEventListener("click",get_open_orders);
	orderInfoGrid.appendChild(list_open_order);

	var list_overdue_order = document.createElement("button");
	list_overdue_order.textContent = "Get Overdue Orders";
	list_overdue_order.className = "button";
	list_overdue_order.addEventListener("click",get_overdue_orders);
	orderInfoGrid.appendChild(list_overdue_order);

	var p1 = document.createElement("button");
	p1.textContent = "this is a place older";
	p1.className = "invisible";
	var p2 = document.createElement("button");
	p2.textContent = "this is a place older";
	p2.className = "invisible";
	var p3 = document.createElement("button");
	p3.textContent = "this is a place older";
	p3.className = "invisible";
	
	orderInfoGrid.appendChild(p1);
	orderInfoGrid.appendChild(p2);
	orderInfoGrid.appendChild(p3);
	d.appendChild(orderInfoGrid);
	mainContainer.appendChild(d);

	var btn = document.getElementById("report-order");
	btn.textContent = "Back";
	btn.setAttribute("id","back");
	btn.removeEventListener("click",render_report_order);
	btn.addEventListener("click",clear_order_screen);
	var btn2 = document.getElementById("edit-order");
	btn2.style.display = "none";
	var btn3 = document.getElementById("new-order");
	btn3.style.display = "none";
}

function render_new_order(){
	var root = document.getElementById("hidden-new-order-menu");
	if(root){
		var btn = document.getElementById("new-order");
		btn.textContent = "Back";
		btn.setAttribute("id","back");
		btn.removeEventListener("click",render_new_order);
		btn.addEventListener("click",clear_order_screen);
		var btn2 = document.getElementById("edit-order");
		btn2.style.display = "none";
		var btn3 = document.getElementById("report-order");
		btn3.style.display = "none";

		root.style.display = null;
		root.setAttribute("id","new-order-menu");
		return;
	}

	// Get the main container
	var mainContainer = document.querySelector('main') || document.getElementById('root');
	if (!mainContainer) {
		mainContainer = document.body;
	}

	// Create card container
	const d = document.createElement("div");
	d.setAttribute("id","new-order-menu");
	d.classList.add("card", "fade-in");

	// Form Header
	var formHeader = document.createElement("div");
	formHeader.className = "card-header";
	formHeader.textContent = "New Sales Order";
	d.appendChild(formHeader);

	// Customer and Price Level Section
	var orderInfoSection = document.createElement("div");
	orderInfoSection.className = "form-section";

	var orderInfoGrid = document.createElement("div");
	orderInfoGrid.className = "form-grid";

	// Customer ID
	var custGroup = document.createElement("div");
	custGroup.className = "form-group";
	var c_label = document.createElement("label");
	c_label.textContent = "Customer ID";
	c_label.setAttribute("for","cust-id");
	custGroup.appendChild(c_label);

	var input_customer = document.createElement("input");
	input_customer.className = "input_2px_border";
	input_customer.setAttribute("id","cust-id");
	input_customer.setAttribute("type","text");
	input_customer.setAttribute("title","Customer identification in the system");
	input_customer.addEventListener("focus",get_customers);
	custGroup.appendChild(input_customer);
	orderInfoGrid.appendChild(custGroup);

	// Price Level
	var priceGroup = document.createElement("div");
	priceGroup.className = "form-group";
	var price_label = document.createElement("label");
	price_label.textContent = "Price Level";
	price_label.setAttribute("for","price-level");
	priceGroup.appendChild(price_label);

	var price_level= document.createElement("input");
	price_level.className = "input_2px_border";
	price_level.setAttribute("id","price-level");
	price_level.setAttribute("type","text");
	priceGroup.appendChild(price_level);
	orderInfoGrid.appendChild(priceGroup);

	// Order Date
	var dateGroup = document.createElement("div");
	dateGroup.className = "form-group";
	var date_label = document.createElement("label");
	date_label.textContent = "Order Date";
	dateGroup.appendChild(date_label);

	var date = document.createElement("label");
	date.setAttribute("id","date");
	date.style.fontSize = "var(--font-size-lg)";
	date.style.fontWeight = "600";
	var today = new Date();
	var day = today.getDate();
	var month = today.getMonth() +1;
	var year = today.getFullYear();
	if(month < 10) month = '0' + month;
	if(day < 10) day = '0' + day;
	date.textContent = `${month}-${day}-${year}`;	
	dateGroup.appendChild(date);
	orderInfoGrid.appendChild(dateGroup);

	orderInfoSection.appendChild(orderInfoGrid);
	d.appendChild(orderInfoSection);

	// Table Section
	var tableSection = document.createElement("div");
	tableSection.className = "form-section";

	var tableHeader = document.createElement("div");
	tableHeader.style.display = "flex";
	tableHeader.style.justifyContent = "space-between";
	tableHeader.style.alignItems = "center";
	tableHeader.style.marginBottom = "var(--spacing-md)";

	var tableTitle = document.createElement("h3");
	tableTitle.className = "section-title";
	tableTitle.textContent = "Order Lines";
	tableTitle.style.marginBottom = "0";
	tableHeader.appendChild(tableTitle);

	var add_line = document.createElement("button");
	add_line.textContent = "➕ Add Line";
	add_line.className = "button";
	add_line.setAttribute("id","add_line");
	add_line.addEventListener("click",function(event){
		add_line_to_order(null,"new-order-table");
	});
	tableHeader.appendChild(add_line);

	tableSection.appendChild(tableHeader);
	d.appendChild(tableSection);

	// Table Container
	var tableContainer = document.createElement("div");
	tableContainer.style.overflowX = "auto";
	tableContainer.appendChild(create_table(1,["Item","Uom","Qty","Disc","Unit Price","Total","Request Date",""],"new-order-table"));
	d.appendChild(tableContainer);

	// Order Total Section
	var totalSection = document.createElement("div");
	totalSection.className = "form-section";
	totalSection.style.borderTop = "2px solid var(--border-color)";
	totalSection.style.paddingTop = "var(--spacing-lg)";
	totalSection.style.marginTop = "var(--spacing-xl)";

	var totalContainer = document.createElement("div");
	totalContainer.style.display = "flex";
	totalContainer.style.justifyContent = "flex-end";
	totalContainer.style.alignItems = "center";
	totalContainer.style.gap = "var(--spacing-md)";

	var order_total_desc = document.createElement("label");
	order_total_desc.textContent = "Order Total:";
	order_total_desc.style.fontSize = "var(--font-size-xl)";
	order_total_desc.style.fontWeight = "600";
	var order_total_label= document.createElement("label");
	order_total_label.style.fontSize = "var(--font-size-xl)";
	order_total_label.style.fontWeight = "700";
	order_total_label.style.color = "var(--primary-color)";
	order_total_label.setAttribute("id","order-total-lbl");
	order_total_label.textContent = "$ 0.00";

	totalContainer.appendChild(order_total_desc);
	totalContainer.appendChild(order_total_label);
	totalSection.appendChild(totalContainer);

	// Form Actions
	var formActions = document.createElement("div");
	formActions.className = "form-actions";
	var submit = document.createElement("button");
	submit.textContent = "💾 Submit Order";
	submit.className = "button success";
	submit.setAttribute("id","submit");
	submit.addEventListener("click",function(event){
		submit_order("new",0,"new-order-table");
	});
	formActions.appendChild(submit);
	totalSection.appendChild(formActions);

	d.appendChild(totalSection);

	// Append to main container
	mainContainer.appendChild(d);
	document.getElementById("new-order-table").addEventListener('change',compute_total);

	// Focus on customer ID input and scroll to show the form
	setTimeout(function() {
		var custInput = document.getElementById("cust-id");
		if (custInput) {
			custInput.focus();
		}
		// Minimal scroll - only scroll if form is not visible
		var formRect = d.getBoundingClientRect();
		var isVisible = formRect.top >= 0 && formRect.top < window.innerHeight;
		window.scrollBy({
			top: 350,
			behavior: 'smooth'
		});

	}, 200);

	var btn = document.getElementById("new-order");
	btn.textContent = "Back";
	btn.setAttribute("id","back");
	btn.removeEventListener("click",render_new_order);
	btn.addEventListener("click",clear_order_screen);

	var btn2 = document.getElementById("edit-order");
	btn2.style.display = "none";
	var btn3 = document.getElementById("report-order");
	btn3.style.display = "none";
}

function compute_total(event) {
	// Check if the event target is an input field within a table row
	if (!(event.target instanceof HTMLInputElement)) return; 

	const current_row = event.target.closest('tr');
	if(!current_row) return;

	let lbl = null;
	let qty_el = null;
	let price_el = null;
	let disc_el = null;

	Array.from(current_row.children).forEach(child =>{
		if(child.firstChild && child.firstChild.classList.contains("tot")) lbl = child.firstChild;
		if(child.firstChild && child.firstChild.classList.contains("qty")) qty_el = child.firstChild;
		if(child.firstChild && child.firstChild.classList.contains("price")) price_el = child.firstChild;
		if(child.firstChild && child.firstChild.classList.contains("disc")) disc_el = child.firstChild;
	});

	if(!qty_el || !price_el || !lbl) return;

	var qty = parseFloat(qty_el.value).toFixed(2);
	var disc = parseFloat(disc_el.value).toFixed(2);
	var price = parseFloat(price_el.value).toFixed(2);

	if(disc == 0.00 || isNaN(disc) || disc < 0){
		lbl.textContent = `$ ${qty * price}`;
	}else{
		var tot = parseFloat((qty * price) - (((qty*price)* disc ) /100)).toFixed(2);
		lbl.textContent = `$ ${tot}`;
	}


	var tbl = document.getElementById("new-order-table");
	if(tbl == null){
		tbl = document.getElementById("edit-order-table");
	}
	if(!tbl) return; // Table doesn't exist yet

	var rows = tbl.rows;
	let sum = 0;
	for(let i = 1;i < rows.length; i++){
		if(rows[i].style.display === "none") break;

		Array.from(rows[i].children).forEach((cell,index)=>{
			Array.from(cell.children).forEach(child =>{
				// Only check elements with "tot" class
				if(child.classList && child.classList.contains("tot")) {
					var totText = child.textContent.trim();
					if(totText && totText !== "") {
						// Remove $ and spaces, then parse
						var numStr = totText.replace(/\$/g, '').replace(/\s+/g, '').trim();
						var numValue = parseFloat(numStr);
						if(!isNaN(numValue)) {
							sum += numValue;
						}
					}
				}
			});
		});
	}

	var tot_lbl = document.getElementById("order-total-lbl");
	if(tot_lbl) {
		if(isNaN(sum) || sum === 0) {
			tot_lbl.textContent = "$ 0.00";
		} else {
			tot_lbl.textContent = `$ ${sum.toFixed(2)}`;
		}
	}

}


function remove_table_row(event,table_id) {
	var table = document.getElementById(table_id);
	if (table.rows.length <= 2) {
		// Don't remove if it's the last data row
		alert("You must have at least one line in the order.");
		return;
	}
	var row = event.target.closest('tr');
	row.remove();
	// Recalculate totals after removing a row
	var event = new Event('change');
	table.dispatchEvent(event);
}

// Helper function to create a table cell based on column type
function create_table_cell(columnName, table_id, row, row_index, set_item_getter) {
	var cell = document.createElement("td");

	if(columnName === "Total"){
		var tot = document.createElement("label");				
		tot.classList.add("tot");
		cell.appendChild(tot);
		return cell;
	}

	if(columnName === "Qty"){
		var input = document.createElement("input");
		input.setAttribute("type","number");
		input.setAttribute("min",0);
		input.classList.add("qty","input_no_border");
		input.value = 0.00;
		cell.appendChild(input);
		return cell;
	}

	if(columnName === "Disc"){
		var input = document.createElement("input");
		input.setAttribute("type","number");
		input.setAttribute("step","0.01");
		input.setAttribute("min",0);
		input.setAttribute("max",100);
		input.classList.add("disc","input_no_border");
		input.setAttribute("id",`order-disc-${row_index}`);
		var data;
		if(table_id !== "edit-order-table"){
			if((data = JSON.parse(localStorage.getItem('customer_order')))){
				if(data.percentage != undefined)
					input.value = data.percentage;
			}else{
				input.value = 0.00;
			}
		} else{
			if((data = JSON.parse(localStorage.getItem('edit_order_data')))){
				if(data.sales_orders_lines.line_1.disc != undefined)
					input.value = data.sales_orders_lines.line_1.disc;
			}else{
				input.value = 0.00;
			}
		}
		cell.appendChild(input);
		return cell;
	}

	if(columnName === "Unit Price"){
		var input = document.createElement("input");
		input.setAttribute("type","number");
		input.setAttribute("step","0.01");
		if(row_index == undefined){
			input.setAttribute("id",`price`);
		}else{
			input.setAttribute("id",`price-${row_index}`);
		}

		input.classList.add("price","input_no_border");
		input.value = 0.00;
		cell.appendChild(input);
		return cell;
	}

	if(columnName === "Request Date"){
		var input = document.createElement("input");
		input.setAttribute("type","date");
		input.classList.add("rdate","input_no_border");
		cell.appendChild(input);
		return cell;
	}	

	if(columnName === ""){
		// Remove button column
		var removeBtn = document.createElement("button");
		removeBtn.textContent = "✕";
		removeBtn.className = "button danger";
		removeBtn.style.fontSize = "var(--font-size-sm)";
		removeBtn.style.padding = "var(--spacing-xs) var(--spacing-sm)";
		removeBtn.style.minWidth = "auto";
		removeBtn.setAttribute("type","button");
		removeBtn.addEventListener("click", function(event) {
			remove_table_row(event,table_id);
		});
		cell.appendChild(removeBtn);
		return cell;
	}

	// Default: regular input field (Item, Uom, etc.)
	var input = document.createElement("input");
	input.className = "input_no_border";
	if(columnName === "Item"){
		if(set_item_getter){
			input.addEventListener("click",get_items);
		}

		if(row_index == undefined){
			input.setAttribute("id",`sales-order-item-`)
		}else{
			input.setAttribute("id",`sales-order-item-${row_index}`)
		}
	}
	if(columnName === "Uom"){
		if(row_index == undefined){
			input.setAttribute("id","uom")
		}else{
			input.setAttribute("id",`uom-${row_index}`)
		}
	}
	cell.appendChild(input);
	return cell;
}

function add_line_to_order(tbl=null, table_id){
	var table = tbl !== null ? tbl : document.getElementById(table_id);
	var row_index = table.rows.length;
	var headerRow = table.rows[0];
	var row = table.insertRow(-1);

	// Get column names from header row
	var columnNames = [];
	for(let i = 0; i < headerRow.cells.length; i++){
		columnNames.push(headerRow.cells[i].textContent.trim());
	}

	// Create cells using the same logic as create_table
	for(let i = 0; i < columnNames.length; i++){
		var cell = create_table_cell(columnNames[i], table_id, row,row_index,event === undefined ? false : true);
		row.appendChild(cell);
	}
}

function get_root_id(){
	let root = null;
	let ids = ["new-order-menu","edit-order-menu","root-new-item","root-new-customer","root-edit-customer","report-order-menu"];
	let size = ids.length;
	let i = 0;
	while(root === null && i < size){
		root = document.getElementById(ids[i]);
		i++;
	}
	return root;
}
function clear_order_screen(event){

	var main_p = document.getElementById("root");
	var root = get_root_id();
	if(root === null)
		return;

	if(event === undefined){
		switch(root.id){
			case "root-new-item":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-root-new-item");
					var btn = document.getElementById("back");
					btn.textContent ="New Item";
					btn.setAttribute("id", "new-item");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_new_item);
					var btn2 = document.getElementById("edit-item");
					btn2.style.display = null;
					break;
				}
			case "report-order-menu":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-report-order-menu");
					var btn = document.getElementById("back");
					btn.textContent ="Reports";
					btn.setAttribute("id", "report-order");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_report_order);
					var btn2 = document.getElementById("edit-order");
					btn2.style.display = null;
					var btn3 = document.getElementById("new-order");
					btn3.style.display = null;
					break;
				}
			case "new-order-menu":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-new-order-menu");
					var btn = document.getElementById("back");
					btn.textContent ="New Order";
					btn.setAttribute("id", "new-order");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_new_order);
					var btn2 = document.getElementById("edit-order");
					btn2.style.display = null;
					var btn3 = document.getElementById("report-order");
					btn3.style.display = null;
					break;
				}
			case "edit-order-menu":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-edit-order-menu");
					var btn = document.getElementById("back");
					btn.textContent ="Edit Order";
					btn.setAttribute("id", "edit-order");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_edit_order);
					var btn2 = document.getElementById("new-order");
					btn2.style.display = null;
					var btn3 = document.getElementById("report-order");
					btn3.style.display = null;
					break;
				}
			case "root-new-customer":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-root-new-customer");
					var btn = document.getElementById("back");
					btn.textContent ="New Customer";
					btn.setAttribute("id", "new-cust");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_new_customer);
					var btn2 = document.getElementById("edit-cust");
					btn2.style.display = null;
					break;
				}

			case "root-edit-customer":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-root-edit-customer");
					var btn = document.getElementById("back");
					btn.textContent ="Edit Customer";
					btn.setAttribute("id", "edit-cust");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_edit_customer);
					var btn2 = document.getElementById("new-cust");
					btn2.style.display = null;
					break;
				}
			default:
				break;
		}
		return;
	}else if(event.type === 'click'){
		switch(root.id){
			case "root-new-item":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-root-new-item");
					var btn = document.getElementById("back");
					btn.textContent ="New Item";
					btn.setAttribute("id", "new-item");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_new_item);
					var btn2 = document.getElementById("edit-item");
					btn2.style.display = null;
					break;
				}
			case "report-order-menu":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-report-order-menu");
					var btn = document.getElementById("back");
					btn.textContent ="Reports";
					btn.setAttribute("id", "report-order");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_report_order);
					var btn2 = document.getElementById("edit-order");
					btn2.style.display = null;
					var btn3 = document.getElementById("new-order");
					btn3.style.display = null;
					break;
				}
			case "new-order-menu":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-new-order-menu");
					var btn = document.getElementById("back");
					btn.textContent ="New Order";
					btn.setAttribute("id", "new-order");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_new_order);
					var btn2 = document.getElementById("edit-order");
					btn2.style.display = null;
					var btn3 = document.getElementById("report-order");
					btn3.style.display = null;
					break;
				}
			case "edit-order-menu":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-edit-order-menu");
					var btn = document.getElementById("back");
					btn.textContent ="Edit Order";
					btn.setAttribute("id", "edit-order");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_edit_order);
					var btn2 = document.getElementById("new-order");
					btn2.style.display = null;
					var btn3 = document.getElementById("report-order");
					btn3.style.display = null;
					break;
				}
			case "root-new-customer":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-root-new-customer");
					var btn = document.getElementById("back");
					btn.textContent ="New Customer";
					btn.setAttribute("id", "new-cust");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_new_customer);
					var btn2 = document.getElementById("edit-cust");
					btn2.style.display = null;
					break;
				}

			case "root-edit-customer":
				{
					root.style.display = "none";
					root.setAttribute("id","hidden-root-edit-customer");
					var btn = document.getElementById("back");
					btn.textContent ="Edit Customer";
					btn.setAttribute("id", "edit-cust");
					btn.removeEventListener("click",clear_order_screen);
					btn.addEventListener("click",render_edit_customer);
					var btn2 = document.getElementById("new-cust");
					btn2.style.display = null;
					break;
				}
			default:
				break;
		}

		let result;
		if(document.getElementById("cust-id") != null){
			/*look for all the elements*/
			var cust_input = document.getElementById("cust-id");
			var price_input = document.getElementById("price-level");
			var tbl_qtys = document.getElementsByClassName("qty");
			var tbl_totals = document.getElementsByClassName("tot");
			var tbl_discs = document.getElementsByClassName("disc");
			var tbl_prices = document.getElementsByClassName("price");

			var ask = false;
			for(let i = 0; i < tbl_qtys.length;i++){
				if(tbl_qtys[i].value != 0) ask = true;
			}
			if(!ask){
				for(let i = 0; i < tbl_totals.length;i++){
					if(tbl_totals[i].textContent !== '') ask = true;
				}
			}
			if(!ask){
				for(let i = 0; i < tbl_discs.length;i++){
					if(tbl_discs[i].value != 0) ask = true;
				}
			}

			if(!ask){
				for(let i = 0; i < tbl_prices.length;i++){
					if(tbl_prices[i].value != 0) ask = true;
				}
			}

			if(ask){
				result = prompt("Do you want to save the order?");
			}
		}

		/*
		if(!result){
			var root = document.getElementById("new-order-menu");
			if(root == null){
				root = document.getElementById("edit-order-menu");
			}
			var btn = document.getElementById("back");
			if(root.id === "new-oreder-menu"){
				btn.textContent ="New Order";
				btn.setAttribute("id", "new-order");
				btn.removeEventListener("click",clear_order_screen);
				btn.addEventListener("click",render_new_order);
				var btn2 = document.getElementById("edit-order");
				btn2.style.display = null;
			}else if(root.id === "edit-order-menu"){
				btn.textContent ="Edit Order";
				btn.setAttribute("id", "edit-order");
				btn.removeEventListener("click",clear_order_screen);
				btn.addEventListener("click",render_edit_order);
				var btn2 = document.getElementById("new-order");
				btn2.style.display = null;
			}
			return;
		}else if(result.toLowerCase() === "yes" || result.toLowerCase() === "y"){
			if(root.id === "new-order-menu"){
				alert("order saved!");
				var root = document.getElementById(root.id);
				root.setAttribute("style","display:'false';");
				var btn = document.getElementById("back");
				btn.textContent ="New Order";
				btn.setAttribute("id", "new-order");
				btn.removeEventListener("click",clear_order_screen);
				btn.addEventListener("click",render_new_order);
				var btn2 = document.getElementById("edit-order");
				btn2.style.display = null;
				return;
			}else if(root.id === "edit-order-menu"){
				alert("changed saved!");
				var root = document.getElementById("edit-order-menu");
				root.setAttribute("style","display:none;");
				var btn = document.getElementById("back");
				btn.textContent = "Edit Order";
				btn.setAttribute("id", "edit-order");
				btn.removeEventListener("click",clear_order_screen);
				btn.addEventListener("click",render_edit_order);
				var btn2 = document.getElementById("new-order");
				btn2.style.display = null;
				return;
			}
			return;
		}*/

	}
}

function remove_null_values(obj){
	return Object.fromEntries(
		Object.entries(obj).filter(([_,v])=> v !== null)
	);
}

function get_table_data(table_id){
	const table = document.getElementById(table_id);
	const headers = Array.from(table.querySelectorAll("th")).map(th => th.textContent.trim());

	let rows = table.rows;
	let data = [];
	let error = false;
	for(let i = 1; i < rows.length; i++){
		let row_obj = {};
		Array.from(rows[i].children).forEach((cell, index) =>{
			Array.from(cell.children).forEach(child =>{
				if(child.value !== "" && child.value !== "0" && child.value != undefined){
					if(child.classList.contains("qty") 
					 	|| child.classList.contains("tot") 
						|| child.classList.contains("price") 
						|| child.classList.contains("disc")){

						if(isNaN(Number(child.value))){
							if(child.classList.contains("qty")){
								error = "qty";
							}else{
								error = false;
							}
						}
						if(!child.classList.contains("tot")
							&& !child.classList.contains("disc")
							&& !child.classList.contains("price")){
							row_obj[headers[index].toLowerCase().replace(" ","_")] = Number(child.value);
						}
					}
				}

				if(child.classList.contains("qty") && child.value === "0"){
					error = "qty";
				}

				if(child.classList.contains("rdate")){
					if(child.value === ""){
						alert("A request date is reqired!");
						error = "date";
					}else{
						row_obj[headers[index].toLowerCase().replace(" ","_")] = child.value;
					}

				}

				if(child.textContent !== "" 
					&& !child.classList.contains("tot")){
					var n = child.textContent.split(" ");
					row_obj[headers[index].toLowerCase()] = n[1];
				}

				if(child.value !== "" && child.id.includes("item")){
					row_obj[`${headers[index].toLowerCase()}_id`] = child.value;
				}
			});
		});

		if(Object.keys(row_obj).length > 0){
			data.push(row_obj);	
		}
	}


	if(error === "date"){
		data = { "date":"error"};
	} else if(error === "qty"){
		data = { "qty":"error"};
	}else if(error){
		data = null;
	}
	return data;
}

async function submit_item(){

	const item_name = document.getElementById("item-name");
	const price_level = document.getElementById("item-price-level");
	const unit_price = document.getElementById("item-u-price");
	const uom = document.getElementById("item-uom");

	var payload = remove_null_values({
		name: item_name.value === "" ? null : item_name.value,
		uom: uom.value === "" ? null : uom.value,
		price_level_id: price_level.value === "" ? null : price_level.value,
		unit_price: unit_price.value === "" ? null : Number(unit_price.value)
	});

	
	const json_payload = JSON.stringify(payload);
	const response = await send(json_payload,"POST","new_item");
	alert(`${response.message}`);
}

async function submit_order(crud_op,value,from_table){
	const cust_id = document.getElementById("cust-id");
	const price_level = document.getElementById("price-level");
	const date = document.getElementById("date");

	let lines = get_table_data(from_table);

	if(lines == null){
		alert("check the input, one or more fields have inllegal values")
		return;
	}else if(lines.date === "error"){
		return;	
	}else if(lines.qty === "error"){
		alert("order quantity must be atleast 1!");
		return;
	}

	if(Object.keys(lines).length == 0){
		if(crud_op == "new"){
			alert("cannot add an empty order");
		}else{
			alert("cannot update this order, do you want to delete it?");
		}

		return;
	}

	//console.log(Array.isArray(lines));
	//console.log(lines.length);

	let lines_count = lines.length;
	let orders_header = remove_null_values({
		date: date.textContent === "" ? null : date.textContent,
		customer_id: cust_id.value === "" ? null : cust_id.value,
		price_level_id: price_level.value === "" ? null : price_level.value,
		lines_nr : Number(`${lines_count}`)
	});

	let payload = {
		sales_orders_head: orders_header,
		sales_orders_lines: lines 
	};

	const json_payload = JSON.stringify(payload);
	if(crud_op === "new"){
		const response = await send(json_payload,"POST","new_sales_order");
		alert(`${response.message}`);
		//clear_order_screen();
	}else if (crud_op === "update"){
		const response = await send(json_payload,"POST",`update_orders/sales/${value}`);
		alert(`${response.message}`);
        if (response.success) clear_order_screen();
	}
}


async function submit_new_customer(){
	var inputs = document.querySelectorAll("input");

	var cust_payload;
	var cust_name = "";
	var cust_country = "";
	var cust_id = "";
	var cust_addr1 = "";
	var cust_addr2= "";
	var cust_csz= "";
	var cust_contact= "";
	var cust_email= "";
	var cust_phone= "";
	var cust_tax= "";
	var cust_warehouse= "";
	var cust_terms= "";
	var cust_credit_limit= "";
	var cust_price_level_id = "";
	inputs.forEach((input) =>{
		if(input.id === "main-pr-level") cust_price_level_id = input.value;
		if(input.id === "new-customer-name") cust_name = input.value;
		if(input.id === "cust-id") cust_id = input.value;
		if(input.id === "addr1") cust_addr1 = input.value;
		if(input.id === "addr2") cust_addr2= input.value;
		if(input.id === "city") cust_csz +=  input.value + " " ;
		if(input.id === "state") cust_csz +=  input.value + " " ;
		if(input.id === "zipcode") cust_csz +=  input.value + " ";
		if(input.id === "country") cust_country = input.value;
		if(input.id === "contact") cust_contact = input.value;
		if(input.id === "email") cust_email = input.value;
		if(input.id === "phone") cust_phone = input.value;
		if(input.id === "chkbox"){
			cust_tax = input.value;
		}
		if(input.id === "warehouse") cust_warehouse = input.value;
		if(input.id === "sale-term") cust_terms = input.value;
		if(input.id === "credit-limit") cust_credit_limit = input.value;
	});

	cust_payload = remove_null_values({
		name: cust_name === "" ? null : cust_name,
		addr: cust_addr1 === "" ? null : cust_addr1,
		csz: cust_csz === "" ? null : cust_csz,
		email: cust_email === "" ? null : cust_email,
		phone: cust_phone === "" ? null : cust_phone,
		c_terms: cust_terms === "" ? null : cust_terms,
		c_limits: cust_credit_limit === "" ? null : cust_credit_limit,
		c_whse_number: cust_warehouse === "" ? null : cust_warehouse,
		price_level_id : cust_price_level_id === "" ? null : cust_price_level_id
	});

	const json_payload = JSON.stringify(cust_payload);
	const response = await send(json_payload,"POST","new_customer");
	alert(`${response.message}`);
}



//d is a document element
function draw_edit_order_table(response,d,id=null,order_nr){

	var c_label = document.createElement("label");
	c_label.textContent = "Customer id:";
	c_label.className = "label";
	d.appendChild(c_label);

	var input_customer = document.createElement("input");
	input_customer.className = "input_2px_border";
	input_customer.setAttribute("id","cust-id");
	if(response.message.sales_orders_head.customer_id != null){
		input_customer.value = response.message.sales_orders_head.customer_id;
	}

	d.appendChild(input_customer);



	/*create price level input field*/	
	var price_label = document.createElement("label");
	price_label.textContent = "Price level:";
	price_label.className = "label";
	d.appendChild(price_label);

	var price_level= document.createElement("input");
	price_level.className = "input_2px_border";
	price_level.setAttribute("id","price-level");

	if(response.message.sales_orders_head.price_level_id != null){
		price_level.value = response.message.sales_orders_head.price_level_id;
	}

	d.appendChild(price_level);

	var add_line = document.createElement("button");
	add_line.textContent = "Add line";
	add_line.setAttribute("id","add_line");
	add_line.setAttribute("style","font-size:18px;margin-rigth:18px;");
	add_line.addEventListener("click", function(event){
		add_line_to_order(null,id == null ? "edit-order-table" : id);
	});
	d.appendChild(add_line);

	var edit = document.createElement("button");
	edit.textContent = "Edit";
	edit.setAttribute("id","edit");
	edit.className = "button";
	edit.addEventListener("click",function(event){
		submit_order("update",`${order_nr}`,id == null ? "edit-order-table" : id);
	}); 
	d.appendChild(edit);

	var date = document.createElement("label");
	date.setAttribute("id","date");
	date.setAttribute("style","font-size:24px;");
	date.textContent = response.message.sales_orders_head.date;	
	d.appendChild(date);

	/*create table and populate with the response */		
	var tbl = create_table(response.message.sales_orders_head.lines_nr,
		["Item","Uom","Qty","Disc","Unit Price","Total","Request Date",""],id == null ? "edit-order-table" : id);

	d.appendChild(tbl);
	var order_total_desc = document.createElement("label");
	order_total_desc.setAttribute("id","order-total-lbl");
	order_total_desc.textContent = "Order Total: $";
	order_total_desc.setAttribute("style","font-size:24px;margin-right:15px;");

	const d_child_one = document.createElement("div")
	d_child_one.setAttribute("id","order-total");
	d_child_one.setAttribute("style","margin-left:74%;");
	d_child_one.appendChild(order_total_desc);
	d.appendChild(d_child_one);

	/*add event to populate the total, int the table*/
	tbl.addEventListener('change',compute_total);

	/* populate the table with the order lines*/
	var rows = tbl.rows;
	if((rows.length - 1) < Number(response.message.sales_orders_head.lines_nr)){
		for(let i = 0; i < Number(response.message.sales_orders_head.lines_nr) -1;i++){
			add_line_to_order(tbl, id == null ? "edit-order-table" : id);		
		}
	}
	var sum = 0;
	for(let i = 1;i < Number(response.message.sales_orders_head.lines_nr) + 1; i++){

		var access_line_name = `line_${i}`;
		Array.from(rows[i].children).forEach((cell,index)=>{
			if(index == 0){
				if(response.message.sales_orders_lines[access_line_name].item_id != undefined){
					cell.children[0].value = response.message
						.sales_orders_lines[access_line_name].item_id;
				}
			}
			if(index == 1){
				if(response.message.sales_orders_lines[access_line_name].uom != undefined){
					cell.children[0].value = response.message
						.sales_orders_lines[access_line_name].uom;
				}
			}
			Array.from(cell.children).forEach(child =>{
				if(child.classList.contains("qty")) {
					child.value = response.message.sales_orders_lines[access_line_name].qty;
				}

				if(child.classList.contains("disc")) {
					if(response.message
						.sales_orders_lines[access_line_name]
						.disc == undefined){
						child.value = 0.00;
					}else{
						child.value = response.message.sales_orders_lines[access_line_name].disc;
					}
				}
				if(child.classList.contains("tot")){
					if(response.message
						.sales_orders_lines[access_line_name]
						.total == undefined){
						child.value = 0.00;
						sum += Number(child.textContent);
					}else{
						child.textContent = `$ ${response.message.sales_orders_lines[access_line_name].total}`;
						sum += Number(response.message.sales_orders_lines[access_line_name].total);
					}
				}
				if(child.classList.contains("price")) {
					child.value = response.message.sales_orders_lines[access_line_name].unit_price;
				}

				if(child.classList.contains("rdate")) {
					child.value = response.message.sales_orders_lines[access_line_name].request_date;
				}
			});
		});
	}

	order_total_desc.textContent += ` ${Number(sum).toFixed(2)}`;
}

function scroll_down(focus_on_this_element,scroll_from_top){
	// Focus  order on cust-id input and scroll to show the form
	setTimeout(function() {
		focus_on_this_element.focus();
		// Minimal scroll - only scroll if form is not visible, then adjust slightly
		//var formRect = d.getBoundingClientRect();
		//var isVisible = formRect.top >= 0 && formRect.top < window.innerHeight;

		window.scrollBy({
			top: scroll_from_top,
			behavior: 'smooth'
		});
		focus_on_this_element.blur();
	}, 200);
}

function repopulate_edit_order_table(response,tbl,id=null,order_nr){

	var edit_btn = document.getElementById("edit");
	edit_btn.removeEventListener("click",submit_order);
	edit_btn.addEventListener("click",function(event){
		submit_order("update",`${order_nr}`,id == null ? "edit-order-table" : id);
	});
	var cust_id = document.getElementById("cust-id");
	var price_level = document.getElementById("price-level");
	var date = document.getElementById("date");
	cust_id.value = response.message.sales_orders_head.customer_id;
	date.textContent = response.message.sales_orders_head.date;
	price_level.value = response.message.sales_orders_head.price_level_id;

	var lines = Number(response.message.sales_orders_head.lines_nr);	
	if((tbl.rows.length -1) < lines){
		for(let i = 0;i < lines - (tbl.rows.length - 1) ; i++){
			add_line_to_order(tbl,tbl.id);
		}
	}
	var rows = tbl.rows;

	var sum = 0;
	for(let i = 1;i < lines + 1; i++){
		var access_line_name = `line_${i}`;


		Array.from(rows[i].children).forEach((cell,index)=>{
			if(index == 0){
				if(response.message.sales_orders_lines[access_line_name].item_id != undefined){
					cell.children[0].value = response.message
						.sales_orders_lines[access_line_name].item_id;
				}else{
					cell.children[0].value ="";

				}
			}
			if(index == 1){
				if(response.message.sales_orders_lines[access_line_name].uom != undefined){
					cell.children[0].value = response.message
						.sales_orders_lines[access_line_name].uom;
				}else{
					cell.children[0].value = "";
				}
			}
			Array.from(cell.children).forEach(child =>{
				if(child.classList.contains("tot")) {
					child.textContent = response.message
						.sales_orders_lines[access_line_name].total;
					sum += Number(response.message.sales_orders_lines[access_line_name].total);
				}
				if(child.classList.contains("qty")) {
					child.value = response.message
						.sales_orders_lines[access_line_name].qty;
				}
				if(child.classList.contains("disc")) {
					if(response.message
						.sales_orders_lines[access_line_name]
						.disc == undefined){
						child.value = 0.00;
					}else{
						child.value = response.message
							.sales_orders_lines[access_line_name].disc;
					}
				}

				if(child.classList.contains("price")) {
					child.value = response.message
						.sales_orders_lines[access_line_name].unit_price;
				}

				if(child.classList.contains("rdate")) {
					child.value = response.message
						.sales_orders_lines[access_line_name].request_date;
				}

			});
		});

	}

	/* clean tbl*/
	for(let i = lines; i < rows.length; i++ ){
		if(i == lines){
			continue;
		}
		tbl.deleteRow(i);
	}

	var ord_table_tot = document.getElementById("order-total-lbl");
	if(ord_table_tot){
		var output_parts  = ord_table_tot.textContent.split("$ ");
		ord_table_tot.textContent = output_parts[0] + "$ " + Number(sum).toFixed(2);

	}

	// Focus  order on cust-id input and scroll to show the form
	setTimeout(function() {
		var custNameInput = document.getElementById("cust-id");
		if (custNameInput) {
			custNameInput.focus();
		}
		// Minimal scroll - only scroll if form is not visible, then adjust slightly
		//var formRect = d.getBoundingClientRect();
		//var isVisible = formRect.top >= 0 && formRect.top < window.innerHeight;

		window.scrollBy({
			top: 450,
			behavior: 'smooth'
		});
	}, 200);
	return;
}

async function show_order_in_report_section(order_nr){

	let response = await send(null,"GET",`sales_orders/${order_nr}`);
	if (!response.success) { alert(response.message); return; }
	if(response == undefined || response == null){
		alert(`could not fetch order ${order_nr} from the server.`);
		return ;
	}

	var table_is_there = document.getElementById("order-table-report")
	if(table_is_there){
		var order_title = document.getElementById("order-title");
		order_title.textContent = `Order ${order_nr}`;
		repopulate_edit_order_table(response,table_is_there,"order-table-report",order_nr);
		return;
	}
	
	var br = document.createElement("br");
	var el = document.getElementById("report-order-menu");
	el.appendChild(br);
	var order_section = document.createElement("div");
	order_section.className = "form-section";
	var order_title = document.createElement("h3");
	order_title.className = "section-title";
	order_title.textContent = `Order ${order_nr}`;
	order_title.setAttribute("id","order-title");
	order_section.appendChild(order_title);


	draw_edit_order_table(response,order_section,"order-table-report",order_nr);
	el.appendChild(order_section);
	var cust = document.getElementById('cust-id');
	scroll_down(cust,450);
}
