function calculateTotal(items) {
    let total = 0;
    for (let item of items) {
        if (item.price > 0) {
            total += item.price;
        }
    }
    return formatCurrency(total);
}

const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
};

function processOrder(order) {
    const validated = validateOrder(order);
    if (validated) {
        const total = calculateTotal(order.items);
        return {
            orderId: order.id,
            total: total,
            status: 'processed'
        };
    }
    return null;
}

const validateOrder = (order) => {
    if (!order || !order.items) return false;
    return order.items.length > 0;
};


module.exports = {
    calculateTotal,
    processOrder,
    validateOrder
};