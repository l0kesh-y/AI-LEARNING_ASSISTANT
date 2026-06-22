const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

async function setupInMemoryDB() {
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'ai-learning-assistant'
      }
    });
    
    const uri = mongoServer.getUri();
    console.log('MongoDB Memory Server started successfully');
    console.log('MongoDB URI:', uri);
    
    return uri;
  } catch (error) {
    console.error('Error starting MongoDB Memory Server:', error);
    throw error;
  }
}

async function stopInMemoryDB() {
  if (mongoServer) {
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped');
  }
}

module.exports = { setupInMemoryDB, stopInMemoryDB };
