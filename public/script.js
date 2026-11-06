
function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
    });

    document.getElementById(sectionId).style.display = 'block';
    document.getElementById('message').textContent = '';

    if (sectionId === 'productsSection') {
        loadProducts();
    }

    if (sectionId === 'adminSection') {
        loadAdminProducts();
    }
}

function showMessage(message, isError = false) {
    const element = document.getElementById('message');
    element.textContent = message || '';
    element.style.color = isError ? 'red' : 'green';
}

// CUSTOMER REGISTRATION
async function register() {
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('registerName').value,
            email: document.getElementById('registerEmail').value,
            password: document.getElementById('registerPassword').value
        })
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);

    if (response.ok) {
        showSection('loginSection');
    }
}

// CUSTOMER / ADMIN LOGIN
async function login() {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value
        })
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);

    if (response.ok) {
        showSection('productsSection');
    }
}

// LOGOUT
async function logout() {
    const response = await fetch('/api/logout', {
        method: 'POST'
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);
    showSection('homeSection');
}

// LOAD PRODUCTS
async function loadProducts() {
    const search = document.getElementById('searchInput').value;

    const response = await fetch(
        '/api/products?search=' + encodeURIComponent(search)
    );

    const data = await response.json();

    document.getElementById('productsList').innerHTML =
        data.products.map(product => `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p>${product.description || ''}</p>
                <p><strong>Price: ₹${product.price}</strong></p>
                <p>Stock: ${product.stock}</p>
                <button onclick="addToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        `).join('');
}

// ADD TO CART
async function addToCart(productId) {
    const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            productId: productId,
            quantity: 1
        })
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);
}

// SHOW CART SECTION AND LOAD CART
async function showCart() {
    showSection('cartSection');
    await loadCart();
}

// LOAD CART ITEMS
async function loadCart() {
    const response = await fetch('/api/cart');
    const data = await response.json();

    if (!response.ok) {
        showMessage(data.message, true);
        return;
    }

    document.getElementById('cartItems').innerHTML =
        data.items.map(item => `
            <div class="product-card">
                <h3>${item.name}</h3>
                <p>Price: ₹${item.price}</p>
                <p>Quantity: ${item.quantity}</p>
                <p>Subtotal: ₹${item.subtotal}</p>

                <button onclick="updateCart(${item.id}, ${item.quantity + 1})">
                    +
                </button>

                <button onclick="updateCart(${item.id}, ${item.quantity - 1})">
                    -
                </button>

                <button onclick="removeFromCart(${item.id})">
                    Remove
                </button>
            </div>
        `).join('') || '<p>Your cart is empty.</p>';

    document.getElementById('cartTotal').textContent =
        'Total: ₹' + data.total;
}

// UPDATE CART QUANTITY
async function updateCart(productId, quantity) {
    if (quantity < 1) {
        await removeFromCart(productId);
        return;
    }

    const response = await fetch('/api/cart/' + productId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);

    if (response.ok) {
        loadCart();
    }
}

// REMOVE CART ITEM
async function removeFromCart(productId) {
    const response = await fetch('/api/cart/' + productId, {
        method: 'DELETE'
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);

    if (response.ok) {
        loadCart();
    }
}

// CHECKOUT
async function checkout() {
    const response = await fetch('/api/checkout', {
        method: 'POST'
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);

    if (response.ok) {
        await loadCart();
    }
}

// CUSTOMER ORDER HISTORY
async function showOrders() {
    showSection('ordersSection');

    const response = await fetch('/api/orders');
    const data = await response.json();

    if (!response.ok) {
        showMessage(data.message, true);
        return;
    }

    document.getElementById('ordersList').innerHTML =
        data.orders.map(order => `
            <div class="product-card">
                <h3>Order #${order.id}</h3>
                <p>Total: ₹${order.total}</p>
                <p>Status: ${order.status}</p>
                <p>Date: ${order.created_at}</p>

                ${order.items.map(item => `
                    <p>${item.name} × ${item.quantity}</p>
                `).join('')}
            </div>
        `).join('') || '<p>No orders found.</p>';
}

// ADMIN: ADD PRODUCT
async function addProduct() {
    const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: Number(document.getElementById('productPrice').value),
            stock: Number(document.getElementById('productStock').value)
        })
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);

    if (response.ok) {
        document.getElementById('productName').value = '';
        document.getElementById('productDescription').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productStock').value = '';

        loadProducts();
        loadAdminProducts();
    }
}

// ADMIN: LOAD PRODUCTS
async function loadAdminProducts() {
    const response = await fetch('/api/products');
    const data = await response.json();

    document.getElementById('adminProducts').innerHTML =
        data.products.map(product => `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p>Price: ₹${product.price}</p>
                <p>Stock: ${product.stock}</p>

                <button onclick="editProduct(
                    ${product.id},
                    '${product.name.replace(/'/g, "\\'")}',
                    '${(product.description || '').replace(/'/g, "\\'")}',
                    ${product.price},
                    ${product.stock}
                )">
                    Edit
                </button>

                <button onclick="deleteProduct(${product.id})">
                    Delete
                </button>
            </div>
        `).join('');
}

// ADMIN: EDIT PRODUCT
async function editProduct(id, name, description, price, stock) {
    const newName = prompt('Product name:', name);
    if (newName === null) return;

    const newDescription = prompt('Product description:', description);
    if (newDescription === null) return;

    const newPrice = prompt('Product price:', price);
    if (newPrice === null) return;

    const newStock = prompt('Product stock:', stock);
    if (newStock === null) return;

    const response = await fetch('/api/admin/products/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: newName,
            description: newDescription,
            price: Number(newPrice),
            stock: Number(newStock)
        })
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);

    if (response.ok) {
        loadAdminProducts();
        loadProducts();
    }
}

// ADMIN: DELETE PRODUCT
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    const response = await fetch('/api/admin/products/' + id, {
        method: 'DELETE'
    });

    const data = await response.json();
    showMessage(data.message, !response.ok);

    if (response.ok) {
        loadAdminProducts();
        loadProducts();
    }
}

// INITIALIZE WEBSITE
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});
