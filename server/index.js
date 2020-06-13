const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const application = express();
application.use(cors());
application.use(bodyParser.json());

// Postgress Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost Connection with PostgreSQL'));
pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express Route Handlers
application.get('/', (request, response) => {
    response.send('Belin!');
});

application.get('/values/all', async (request, response) => {
    const values = await pgClient.query('SELECT * FROM values');
    response.send(values.rows);
});

application.get('/values/current', async (request, response) => {
    const values = await pgClient.query('SELECT * FROM values');
    redisClient.hgetall('values', (err, values) => {
        response.send(values);
    });
});

application.post('/values', async (request, response) => {
   const index = request.body.index;
   
   if(parseInt(index) > 40){
       return response.status('422').send('Submitted index is too high [max: 40]');
   }

   redisClient.hset('values', index, 'Nothing yet!');
   redisPublisher.publish('insert', index);

   pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
   response.send({ working: true });
});

application.listen(5000, err => {
    console.log('Express Server Listening on port 5000.');
});