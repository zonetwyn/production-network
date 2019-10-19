/**
 * Generate seeds - generate given number of seeds for a trader
 * @param {org.zonetwyn.production.GenerateSeed} generateSeed
 * @transaction
 */
async function generateSeeds(generateSeed) {
  try {
    // Load trader
    let trader = generateSeed.trader;
    
    // Generate random seeds number
    let count = 0;
    do {
      count = Math.round(Math.random() * 20);
    } while(count < 5);

    // Generate seeds
    let factory = getFactory();
    let seeds = [];
    const seedRegistry = await getAssetRegistry('org.zonetwyn.production.Seed');
    for (let i=0; i<count; i++) {
      const time = Date.now();
      let seed = factory.newResource('org.zonetwyn.production', 'Seed', ''+time);
      seed.expiredAt = new Date();
      seed.price = 10.0;
      seed.owner = trader;

      // Register seed
      await seedRegistry.add(seed);

      seeds.push(seed);
    }

    // Add seeds to trader
    trader.seeds = seeds;
    const traderRegistry = await getParticipantRegistry('org.zonetwyn.production.Trader');
    await traderRegistry.update(trader);
    
  } catch (error) {
    console.log(error);
  }
} 


/**
 * Trade seeds - trader sell seeds to farmer
 * @param {org.zonetwyn.production.TradeSeed} tradeSeed
 * @transaction
 */
async function tradeSeed(tradeSeed) {
  try {
    // Load owners
    let trader = tradeSeed.trader;
    let farmer = tradeSeed.farmer;
    const quantity = tradeSeed.quantity;
    
    // Check quantity
    if (quantity <= 0) {
      console.log('Wrong quantity');
      return;
    }

    let seeds = trader.seeds;
    if (quantity > seeds.length) {
      console.log('Trader does not has enough seeds');
      return;
    }

    // Check farmer balance
    const totalPrice = quantity * seeds[0].price;
    if (totalPrice > farmer.balance) {
      console.log('Farmer does not have sufficient funds');
      return;
    }

    // Process trade
    const seedRegistry = await getAssetRegistry('org.zonetwyn.production.Seed');
    const soldSeeds = [];
    let count = 0;
    while (count < quantity) {
      let seed = seeds.pop();
      seed.owner = farmer;
      await seedRegistry.update(seed);
      soldSeeds.push(seed);
      count++;
    }

    // Update owners
    let traderBalance = trader.balance;
    let farmerBalance = farmer.balance;

    trader.balance = traderBalance + totalPrice;
    farmer.balance = farmerBalance - totalPrice;
    trader.seeds = seeds;
    farmer.seeds = soldSeeds;

    const traderRegistry = await getParticipantRegistry('org.zonetwyn.production.Trader');
    const farmerRegistry = await getParticipantRegistry('org.zonetwyn.production.Farmer');

    await traderRegistry.update(trader);
    await farmerRegistry.update(farmer);

  } catch (error) {
    console.log(error)
  }
}

/**
 * Harvest seeds - farmer harvest his seeds and create beans
 * @param {org.zonetwyn.production.Harvest} harvest
 * @transaction
 */
async function harvest(harvest) {
  try {
    // Load farmer
    let farmer = harvest.farmer;
    let seeds = farmer.seeds;

    // Generate beans
    let factory = getFactory();
    const beanRegistry = await getAssetRegistry('org.zonetwyn.production.Bean');
    const seedRegistry = await getAssetRegistry('org.zonetwyn.production.Seed');
    const beans = [];
    for (let i=0; i<seeds.length; i++) {
      const time = Date.now();
      const seed = seeds[i];
      const bean = factory.newResource('org.zonetwyn.production', 'Bean', ''+time);
      bean.harvestedAt = new Date();
      bean.price = seed.price;
      bean.owner = seed.owner;

      // Register bean
      beanRegistry.add(bean);
      beans.push(bean);

      // Delete seed
      await seedRegistry.remove(seed);
    }

    // Add beans to farmer
    farmer.beans = beans;
    farmer.seeds = [];
    farmer.harvestersCount = beans.length;
    const farmerRegistry = await getParticipantRegistry('org.zonetwyn.production.Farmer');
    await farmerRegistry.update(farmer);

  } catch (error) {
    console.log(error);
  }
}

/**
 * Trade bean - farmer sell beans to factory
 * @param {org.zonetwyn.production.TradeBean} tradeBean
 * @transaction
 */
async function tradeBean(tradeBean) {
  try {
    // Load owners
    let farmer = tradeBean.farmer;
    let factory = tradeBean.factory;
    const quantity = tradeBean.quantity;

    // Check quantity
    if (quantity <= 0) {
      console.log('Wrong quantity');
      return;
    }

    let beans = farmer.beans;
    if (quantity > beans.length) {
      console.log('Factory does not has enough beans');
      return;
    }

    // Check factory balance
    const totalPrice = quantity * beans[0].price;
    if (totalPrice > factory.balance) {
      console.log('Factory does not has enough funds');
      return;
    }

    // Process trade
    const beanRegistry = await getAssetRegistry('org.zonetwyn.production.Bean');
    const soldBeans = [];
    let count = 0;
    while (count < quantity) {
      let bean = beans.pop();
      bean.owner = factory;
      await beanRegistry.update(bean);
      soldBeans.push(bean);
      count++;
    }

    // Update owners
    let farmerBalance = farmer.balance;
    let factoryBalance = factory.balance;

    farmer.balance = farmerBalance + totalPrice;
    factory.balance = factoryBalance - totalPrice;
    farmer.beans = beans;
    factory.beans = soldBeans;

    const farmerRegistry = await getParticipantRegistry('org.zonetwyn.production.Farmer');
    const factoryRegistry = await getParticipantRegistry('org.zonetwyn.production.Factory');

    await farmerRegistry.update(farmer);
    await factoryRegistry.update(factory);

  } catch (error) {
    console.log(error);
  }
}

/**
 * Transformation - factory transform beans and generate products
 * @param {org.zonetwyn.production.Transformation} transformation
 * @transaction
 */
async function transformation(transformation) {
  try {
    // Load factory
    let factory = transformation.factory;
    let beans = factory.beans;

    // Generate products
    const names = [{
      "name": "Coffee - Colombian, Portioned"
    }, {
      "name": "Rice Pilaf, Dry,package"
    }, {
      "name": "Bread - Malt"
    }, {
      "name": "Pineapple - Regular"
    }, {
      "name": "Beef - Short Loin"
    }, {
      "name": "Puree - Blackcurrant"
    }, {
      "name": "Flower - Dish Garden"
    }, {
      "name": "Salt - Sea"
    }, {
      "name": "Pasta - Spaghetti, Dry"
    }, {
      "name": "Cheese - Cheddar, Mild"
    }, {
      "name": "Wine - Redchard Merritt"
    }, {
      "name": "Evaporated Milk - Skim"
    }, {
      "name": "Wine - Red, Cooking"
    }, {
      "name": "Soup - Knorr, Ministrone"
    }, {
      "name": "Artichoke - Hearts, Canned"
    }, {
      "name": "Extract - Rum"
    }, {
      "name": "Beans - Navy, Dry"
    }, {
      "name": "Juice - Grapefruit, 341 Ml"
    }, {
      "name": "Veal - Round, Eye Of"
    }, {
      "name": "Wine - Toasted Head"
    }, {
      "name": "Wine - Fried Head"
    }]
    const types = ["CHOCOLATE", "COCOA_POWDER"];

    let fabric = getFactory();
    const stockRegistry = await getAssetRegistry('org.zonetwyn.production.Stock');
    const productRegistry = await getAssetRegistry('org.zonetwyn.production.Product');
    const beanRegistry = await getAssetRegistry('org.zonetwyn.production.Bean');

    let products = factory.products ? factory.products : [];
    for (let i=0; i<beans.length; i++) {
      const bean = beans[i];
      // Generate name
      const name = names[Math.round(Math.random() * 20)].name;
      let existingProducts = await query('selectProductByName', { 
        productName: name,
        factoryId: `resource:org.zonetwyn.production.Factory#${factory.ownerId}` 
      });
      if (existingProducts && existingProducts.length > 0) {
        let product = existingProducts[0];
        let stocks = await query('selectStockByProduct', {
          productId: `resource:org.zonetwyn.production.Product#${product.productId}`
        });
        if (stocks && stocks.length > 0) {
          let stock = stocks[0];
          stock.quantity = ++(stock.quantity);
          // Update stock
          await stockRegistry.update(stock);
        }
      } else {
        // Generate product
        const pId = Date.now();
        let product = fabric.newResource('org.zonetwyn.production', 'Product', ''+pId);
        product.owner = factory;
        product.productName = name;
        product.issuedAt = new Date();
        // Expired at 
        let expiredAt = new Date();
        expiredAt.setFullYear(expiredAt.getFullYear() + 1);
        product.expiredAt = expiredAt;
        // Type
        product.type = types[Math.round(Math.random())];
        product.price = bean.price * (Math.round(Math.random() * 500));
        await productRegistry.add(product);

        // Generate stock
        const sId = Date.now();
        let stock = fabric.newResource('org.zonetwyn.production', 'Stock', ''+sId);
        stock.quantity = 1;
        stock.owner = factory;
        stock.product = product;
        await stockRegistry.add(stock);

        products.push(product);
      }

      // Delete bean
      await beanRegistry.remove(bean);
    }

    factory.beans = [];
    factory.products = products;
    const factoryRegistry = await getParticipantRegistry('org.zonetwyn.production.Factory');
    await factoryRegistry.update(factory);
    
  } catch (error) {
    console.log(error);
  }
}

/**
 * Trade Product - factory sell product to market
 * @param {org.zonetwyn.production.TradeProduct} tradeProduct
 * @transaction
 */
async function tradeProduct(tradeProduct) {
  try {
    // Load owners
    let factory = tradeProduct.factory;
    let market = tradeProduct.market;
    const records = tradeProduct.records;

    // Check disponibility
    let message = '';
    let availableItems = [];
    let totalPrice = 0;
    for (let i=0; i<records.length; i++) {
      let record = records[i];
      let products = await query('selectProductByName', {
        productName: record.name,
        factoryId: `resource:org.zonetwyn.production.Factory#${factory.ownerId}`
      });
      if (products && products.length > 0) {
        const product = products[0];
        let stocks = await query('selectStockByProduct', {
          productId: `resource:org.zonetwyn.production.Product#${product.productId}`
        });
        if (stocks && stocks.length > 0) {
          let stock = stocks[0];
          if (stock.quantity >= record.quantity) {
            totalPrice += (record.quantity * product.price);
            availableItems.push({
              name: record.name,
              quantity: record.quantity,
              product: product,
              stock: stock
            });
          } else {
            message += `Factory does not has enough {${record.name}}\n`;
          }
        }
      } else {
        message += `Product with name {${record.name}} does not exits in stock\n`;
      }
    }

    if (availableItems.length == 0 || message !== '') return console.log(message);

    // Check market price
    if (totalPrice > market.balance) return console.log('Market does not have sufficient funds');

    // Sell products
    let fabric = getFactory();
    const stockRegistry = await getAssetRegistry('org.zonetwyn.production.Stock');
    const productRegistry = await getAssetRegistry('org.zonetwyn.production.Product');

    let totalProducts = market.products ? market.products : [];
    for (let i=0; i<availableItems.length; i++) {
      const item = availableItems[i];
      // Transfer products to market
      const existingProducts = await query('selectProductByName', {
        productName: item.name,
        factoryId: `resource:org.zonetwyn.production.Market#${market.ownerId}` 
      });
      if (existingProducts && existingProducts.length > 0) {
        const product = existingProducts[0];
        let stocks = await query('selectStockByProduct', {
          productId: `resource:org.zonetwyn.production.Product#${product.productId}`
        });
        if (stocks && stocks.length > 0) {
          let stock = stocks[0];
          stock.quantity += item.quantity;
          await stockRegistry.update(stock);
        }
      } else {
        // Generate product
        const pId = Date.now();
        let product = fabric.newResource('org.zonetwyn.production', 'Product', ''+pId);
        product.owner = market;
        product.productName = item.name;
        product.issuedAt = item.product.issuedAt;
        product.expiredAt =item.product.expiredAt;
        product.type = item.product.type;
        product.price = (item.product.price * 0.2) + item.product.price;
        await productRegistry.add(product);

        // Generate stock
        const sId = Date.now();
        let stock = fabric.newResource('org.zonetwyn.production', 'Stock', ''+sId);
        stock.quantity = item.quantity;
        stock.owner = market;
        stock.product = product;
        await stockRegistry.add(stock);

        totalProducts.push(product);
      }

      // Update factory stock
      const factoryStock = item.stock;
      factoryStock.quantity = factoryStock.quantity - item.quantity;
      await stockRegistry.update(factoryStock);
    }

    // Update owners
    factory.balance = factory.balance + totalPrice;
    market.balance = market.balance - totalPrice;
    market.products = totalProducts;

    const marketRegistry = await getParticipantRegistry('org.zonetwyn.production.Market');
    const factoryRegistry = await getParticipantRegistry('org.zonetwyn.production.Factory');
    await marketRegistry.update(market);
    await factoryRegistry.update(factory);
    
  } catch (error) {
    console.log(error);
  }
}

/**
 * Process Order - Sell product to customer
 * @param {org.zonetwyn.production.ProcessOrder} processOrder
 * @transaction
 */
async function processOrder(processOrder) {
  try {
    // Load owners
    let market = processOrder.market;
    let customer = processOrder.customer;
    let records = processOrder.records;

    // Check disponiblity
    let message = '';
    let availableItems = [];
    let totalPrice = 0;
    for (let i=0; i<records.length; i++) {
      let record = records[i];
      let products = await query('selectProductByName', {
        productName: record.name,
        factoryId: `resource:org.zonetwyn.production.Market#${market.ownerId}`
      });
      if (products && products.length > 0) {
        const product = products[0];
        let stocks = await query('selectStockByProduct', {
          productId: `resource:org.zonetwyn.production.Product#${product.productId}`
        });
        if (stocks && stocks.length > 0) {
          let stock = stocks[0];
          if (stock.quantity >= record.quantity) {
            totalPrice += (record.quantity * product.price);
            availableItems.push({
              quantity: record.quantity,
              stock: stock
            });
          } else {
            message += `Market does not has enough {${record.name}}\n`;
          }
        }
      } else {
        message += `Product with name {${record.name}} does not exits in stock\n`;
      }
    }

    if (availableItems.length == 0 || message !== '') return console.log(message);

    // Check customer balance
    if (totalPrice > customer.balance) return console.log('Customer does not has enough funds');

    // Sell products
    let factory = getFactory();
    const stockRegistry = await getAssetRegistry('org.zonetwyn.production.Stock');
    for (let i=0; i<availableItems.length; i++) {
      const item = availableItems[i];
      // Update factory stock
      const factoryStock = item.stock;
      factoryStock.quantity = factoryStock.quantity - item.quantity;
      await stockRegistry.update(factoryStock);
    }

    // Create order
    const orderResgistry = await getAssetRegistry('org.zonetwyn.production.Order');
    const orderId = Date.now();
    let order = factory.newResource('org.zonetwyn.production', 'Order', ''+orderId);
    order.issuedAt = new Date();
    order.totalPrice = totalPrice;
    order.records = records;
    order.market = market;
    order.customer = customer;
    await orderResgistry.add(order);

    // Update owners
    market.balance = market.balance + totalPrice;
    const orders = customer.orders ? customer.orders : [];
    orders.push(order);
    customer.orders = orders;
    customer.balance = customer.balance - totalPrice;

    const marketRegistry = await getParticipantRegistry('org.zonetwyn.production.Market');
    const customerRegistry = await getParticipantRegistry('org.zonetwyn.production.Customer');
    await marketRegistry.update(market);
    await customerRegistry.update(customer);
  } catch (error) {
    console.log(error);
  }
}
