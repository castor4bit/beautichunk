function _0x1a2b() {
  const _0x3c4d = [
    'log',
    'error',
    'warn'
  ];
  return _0x1a2b = function () {
    return _0x3c4d;
  }, _0x1a2b();
}
const _0x5e6f = _0x1a2b;
(function (_0x7g8h, _0x9i0j) {
  const _0x1k2l = _0x1a2b,
    _0x3m4n = _0x7g8h();
  while (!![]) {
    try {
      const _0x5o6p = -parseInt(_0x1k2l(0)) / 1;
      if (_0x5o6p === _0x9i0j)
        break;
      else
        _0x3m4n['push'](_0x3m4n['shift']());
    } catch (_0x7q8r) {
      _0x3m4n['push'](_0x3m4n['shift']());
    }
  }
}(_0x1a2b, 107187));
class ShoppingCart {
  constructor() {
    this.items = [];
  }
  addItem(product, quantity) {
    const existing = this.items.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({
        product,
        quantity
      });
    }
  }
  removeItem(productId) {
    this.items = this.items.filter(item => item.product.id !== productId);
  }
  calculateTotal() {
    return this.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }
  clearCart() {
    this.items = [];
  }
}
class User {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.orders = [];
    this.cart = new ShoppingCart();
  }
  placeOrder(orderManager) {
    const order = orderManager.createOrder(this);
    if (order) {
      this.orders.push(order);
      this.cart.clearCart();
      return order;
    }
    return null;
  }
}
class Product {
  constructor(id, name, price, stock) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
  }
  isAvailable(quantity) {
    return this.stock >= quantity;
  }
  reduceStock(quantity) {
    if (this.isAvailable(quantity)) {
      this.stock -= quantity;
      return true;
    }
    return false;
  }
}
class Order {
  constructor(id, userId, items, total) {
    this.id = id;
    this.userId = userId;
    this.items = items;
    this.total = total;
    this.status = 'pending';
    this.createdAt = new Date();
  }
  updateStatus(status) {
    this.status = status;
    console[_0x5e6f(0)](`Order ${ this.id } status updated to ${ status }`);
  }
}
class OrderManager {
  constructor() {
    this.orders = [];
    this.orderIdCounter = 1;
  }
  createOrder(user) {
    const items = user.cart.items;
    if (items.length === 0) {
      console[_0x5e6f(1)]('Cart is empty');
      return null;
    }
    const total = user.cart.calculateTotal();
    const order = new Order(this.orderIdCounter++, user.id, [...items], total);
    this.orders.push(order);
    return order;
  }
  processPayment(orderId, paymentInfo) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      console[_0x5e6f(1)]('Order not found');
      return false;
    }
    if (paymentInfo.amount >= order.total) {
      order.updateStatus('paid');
      console[_0x5e6f(0)]('Payment processed successfully');
      return true;
    }
    console[_0x5e6f(2)]('Insufficient payment amount');
    return false;
  }
  shipOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      console[_0x5e6f(1)]('Order not found');
      return false;
    }
    if (order.status === 'paid') {
      order.updateStatus('shipped');
      return true;
    }
    console[_0x5e6f(2)]('Order must be paid before shipping');
    return false;
  }
}

function initializeStore() {
  const products = [
    new Product(1, 'Laptop', 999.99, 10),
    new Product(2, 'Mouse', 29.99, 50),
    new Product(3, 'Keyboard', 79.99, 30),
    new Product(4, 'Monitor', 299.99, 15),
    new Product(5, 'Headphones', 149.99, 20)
  ];
  const users = [
    new User(1, 'John Doe', 'john@example.com'),
    new User(2, 'Jane Smith', 'jane@example.com')
  ];
  const orderManager = new OrderManager();
  return {
    products,
    users,
    orderManager
  };
}

function simulateUserActivity() {
  const {
    products,
    users,
    orderManager
  } = initializeStore();
  const user = users[0];
  console[_0x5e6f(0)](`${ user.name } is shopping...`);
  user.cart.addItem(products[0], 1);
  user.cart.addItem(products[1], 2);
  user.cart.addItem(products[2], 1);
  console[_0x5e6f(0)](`Cart total: $${ user.cart.calculateTotal() }`);
  const order = user.placeOrder(orderManager);
  if (order) {
    console[_0x5e6f(0)](`Order created with ID: ${ order.id }`);
    orderManager.processPayment(order.id, {
      amount: 1200
    });
    orderManager.shipOrder(order.id);
  }
}
simulateUserActivity();
