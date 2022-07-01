const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const product = require('./routes/produto');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
const NodeHog = require('nodehog');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const serverStatus = () => {
    return { 
       state: 'up', 
       dbState: mongoose.STATES[mongoose.connection.readyState] 
    }
  };

app.get('/health', (res, req) => {  
    let healthResult = serverStatus();   
    if (mongoose.connection.readyState == 0) {
        req.statusCode = 500;
        req.send('down');        
    } else {
        req.json(healthResult);
    }        
});

app.get('/stress/:elemento/tempostress/:tempoStress/tempofolga/:tempoFolga/ciclos/:ciclos', (req, res) => {
    
    const elemento = req.params.elemento;
    const tempoStress = req.params.tempoStress * 1000;
    const tempoFolga = req.params.tempoFolga * 1000;
    const ciclos = req.params.ciclos;
    new NodeHog(elemento, tempoStress, tempoFolga, ciclos).start();
    res.send("OK");
});

app.use('/api/produto', product);

var developer_db_url = 'mongodb://mongouser:mongopwd@mdb:27017/admin';
var mongoUrl = process.env.MONGODB_URI || developer_db_url;

mongoose.Promise = global.Promise;

var connectWithRetry = function() {
    return mongoose.connect(mongoUrl, function(err) {
        if (err) {
            console.error('Failed to connect to mongo on startup - retrying in 5 sec', err);
            setTimeout(connectWithRetry, 5000);
        }
    });
};
  
connectWithRetry();

var port = process.env.SERVER_PORT || 8080;

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
