class ShoppingCart {
    constructor() {
        this.items = [];
        this.discounts = [];
        this.taxRate = 0.08;
    }

    addItem(product, quantity = 1) {
        const existingItem = this.findItem(product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            this.updateItemTotal(existingItem);
        } else {
            const newItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                total: product.price * quantity
            };
            this.items.push(newItem);
        }
        
        this.validateCart();
        return this.calculateSubtotal();
    }

    removeItem(productId) {
        const index = this.items.findIndex(item => item.id === productId);
        if (index > -1) {
            this.items.splice(index, 1);
            this.validateCart();
            return true;
        }
        return false;
    }

    updateQuantity(productId, newQuantity) {
        const item = this.findItem(productId);
        if (item && newQuantity > 0) {
            item.quantity = newQuantity;
            this.updateItemTotal(item);
            this.validateCart();
            return true;
        } else if (item && newQuantity === 0) {
            return this.removeItem(productId);
        }
        return false;
    }

    findItem(productId) {
        return this.items.find(item => item.id === productId);
    }

    updateItemTotal(item) {
        item.total = item.price * item.quantity;
    }

    validateCart() {
        if (this.items.length === 0) {
            this.discounts = [];
            return false;
        }
        
        
        for (let item of this.items) {
            if (item.quantity <= 0) {
                throw new Error(`Invalid quantity for ${item.name}`);
            }
            if (item.price <= 0) {
                throw new Error(`Invalid price for ${item.name}`);
            }
        }
        
        return true;
    }

    applyDiscount(discountCode) {
        const discount = this.validateDiscountCode(discountCode);
        if (discount) {
            const existingDiscount = this.discounts.find(d => d.code === discountCode);
            if (!existingDiscount) {
                this.discounts.push(discount);
                return true;
            }
        }
        return false;
    }

    validateDiscountCode(code) {
        
        const validCodes = {
            'SAVE10': { code: 'SAVE10', type: 'percentage', value: 0.1, minAmount: 50 },
            'FLAT20': { code: 'FLAT20', type: 'fixed', value: 20, minAmount: 100 },
            'NEWUSER': { code: 'NEWUSER', type: 'percentage', value: 0.15, minAmount: 0 }
        };

        const discount = validCodes[code.toUpperCase()];
        if (discount && this.calculateSubtotal() >= discount.minAmount) {
            return discount;
        }
        return null;
    }

    calculateSubtotal() {
        return this.items.reduce((sum, item) => sum + item.total, 0);
    }

    calculateDiscountAmount() {
        const subtotal = this.calculateSubtotal();
        return this.discounts.reduce((totalDiscount, discount) => {
            if (discount.type === 'percentage') {
                return totalDiscount + (subtotal * discount.value);
            } else {
                return totalDiscount + discount.value;
            }
        }, 0);
    }

    calculateTax(amount) {
        return amount * this.taxRate;
    }

    calculateTotal() {
        const subtotal = this.calculateSubtotal();
        const discountAmount = this.calculateDiscountAmount();
        const discountedAmount = subtotal - discountAmount;
        const tax = this.calculateTax(discountedAmount);
        
        return {
            subtotal: subtotal,
            discount: discountAmount,
            tax: tax,
            total: discountedAmount + tax
        };
    }

    isEmpty() {
        return this.items.length === 0;
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    clear() {
        this.items = [];
        this.discounts = [];
    }

    toJSON() {
        return {
            items: this.items,
            discounts: this.discounts,
            totals: this.calculateTotal()
        };
    }
}


function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

function createProduct(name, price, id = null) {
    return {
        id: id || generateProductId(),
        name: name,
        price: parseFloat(price)
    };
}

function generateProductId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}


function demonstrateCart() {
    const cart = new ShoppingCart();
    
    const product1 = createProduct("Laptop", 999.99);
    const product2 = createProduct("Mouse", 29.99);
    
    cart.addItem(product1);
    cart.addItem(product2, 2);
    
    cart.applyDiscount("SAVE10");
    
    return cart.calculateTotal();
}

function processCheckout(cartData) {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
        throw new Error("Cannot process empty cart");
    }
    
    const total = cartData.totals.total;
    
    if (total < 0) {
        throw new Error("Invalid cart total");
    }
    
    return {
        orderId: generateOrderId(),
        total: total,
        status: 'processed',
        timestamp: new Date().toISOString()
    };
}

function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

module.exports = {
    ShoppingCart,
    createProduct,
    demonstrateCart,
    processCheckout,
    formatCurrency
};