document.addEventListener('DOMContentLoaded', () => {
    const orderListBody = document.getElementById('order-list-body');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole'); // Assuming you save role upon login

    // Basic admin check - redirect if not admin
    if (!userId || userRole != 'admin') {
        alert('Access denied. Please log in as an administrator.');
        window.location.href = 'singin.html';
        return;
    }

    const API_URL = 'http://localhost:3000/orders';
    const statusClasses = {
        'Processing': 'status-processing',
        'Shipped': 'status-shipped',
        'Delivered': 'status-delivered',
        'Cancelled': 'status-cancelled'
    };

    async function fetchOrders() {
        orderListBody.innerHTML = '<tr><td colspan="7">Loading orders...</td></tr>';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch orders.');
            }
            const orders = await response.json();
            displayOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            orderListBody.innerHTML = '<tr><td colspan="7">Error loading orders.</td></tr>';
        }
    }

    function displayOrders(orders) {
        orderListBody.innerHTML = '';
        if (orders.length === 0) {
            orderListBody.innerHTML = '<tr><td colspan="7">No orders found.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            const date = new Date(order.order_date).toLocaleDateString();

            row.innerHTML = `
                <td>${order.order_id}</td>
                <td>${order.user_name}</td>
                <td>${date}</td>
                <td>${order.total_items}</td>
                <td>$${order.total_amount.toFixed(2)}</td>
                <td>
                    <span class="${statusClasses[order.status] || ''}">${order.status}</span>
                </td>
                <td>
                    <select class="status-selector" data-order-id="${order.order_id}">
                        <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            `;
            orderListBody.appendChild(row);
        });

        // Attach event listeners to status selectors
        document.querySelectorAll('.status-selector').forEach(select => {
            select.addEventListener('change', handleStatusChange);
        });
    }

    async function handleStatusChange(event) {
        const select = event.target;
        const orderId = select.dataset.orderId;
        const newStatus = select.value;

        // Optionally, disable the selector during the request
        select.disabled = true;

        try {
            const response = await fetch(`${API_URL}/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update status.');
            }

            // Success: Re-fetch and display orders to update the list, or just update the UI cell
            alert(`Order #${orderId} status updated to ${newStatus}.`);
            fetchOrders(); 

        } catch (error) {
            console.error('Update failed:', error);
            alert(`Error updating order status: ${error.message}`);
            
            // Re-enable and reset the selector if the update failed
            select.disabled = false;
            fetchOrders(); // Re-fetch to revert the dropdown to the correct status
        }
    }

    fetchOrders();
});