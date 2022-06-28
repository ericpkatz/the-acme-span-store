const express = require('express');
const app = express();
const path = require('path');

const { faker } = require('@faker-js/faker');
const Sequelize = require('sequelize');
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_spans_db');
const { UUID, UUIDV4, STRING } = conn.Sequelize;

const common = {
  id: {
    type: UUID,
    primaryKey: true,
    defaultValue: UUIDV4
  },
  name: {
    type: STRING
  }
};

const Color = conn.define('color', common); 

const Size = conn.define('size', common);

const Weight = conn.define('weight', common);

const Span = conn.define('span', {
  text: {
    type: STRING
  },
  colorId: {
    type: UUID,
    allowNull: false
  },
  sizeId: {
    type: UUID,
    allowNull: false
  },
  weightId: {
    type: UUID,
    allowNull: false
  }
});

Span.belongsTo(Size);
Span.belongsTo(Color);
Span.belongsTo(Weight);
app.use('/dist', express.static('dist'));

app.get('/', (req, res, next)=> res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/spans/:filter?', async(req, res, next)=> {
  const filter = JSON.parse(req.params.filter || '{}');
  const where = {};
  if(filter.colors){
    where.colorId = filter.colors;
  }
  if(filter.weights){
    where.weightId = filter.weights;
  }
  if(filter.sizes){
    where.sizeId = filter.sizes;
  }
  try {
    res.send(await Span.findAll({
      include: [Color, Size, Weight],
      where
    }));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/facets/:filter?', async(req, res, next)=> {
  //TODO populate facets!
  try {
    const filter = JSON.parse(req.params.filter || '{}');
    console.log(filter);
    const [colors, weights, sizes] = await Promise.all([
      Color.findAll(),
      Weight.findAll(),
      Size.findAll()
    ]);
    res.send({
      colors, weights, sizes
    });
  }
  catch(ex){
    next(ex);
  }
});

const setup = async()=> {
  if(!process.env.SYNC){
    return;
  }
  try {
    await conn.sync({ force: true });
    const sizes = await Promise.all([
      Size.create({ name: '0.5rem'}),
      Size.create({ name: '1.0rem'}),
      Size.create({ name: '1.5rem'}),
      Size.create({ name: '2.0rem'}),
    ]);
    const colors = await Promise.all([
      Color.create({ name: 'tomato'}),
      Color.create({ name: 'olive'}),
      Color.create({ name: 'dodgerBlue'}),
      Color.create({ name: 'teal'}),
    ]);
    const weights = await Promise.all([
      Weight.create({ name: '100'}),
      Weight.create({ name: '200'}),
      Weight.create({ name: '300'}),
      Weight.create({ name: '400'}),
      Weight.create({ name: '500'}),
      Weight.create({ name: '600'}),
      Weight.create({ name: '700'}),
    ]);
    const spans = new Array(1000).fill('-').map(_=> {
      return {
        text: faker.lorem.words(3),
        weightId: faker.helpers.arrayElement(weights).id,
        colorId: faker.helpers.arrayElement(colors).id,
        sizeId: faker.helpers.arrayElement(sizes).id,

      }
    });
    await Promise.all(spans.map( span=> Span.create(span)));

    const tealAnd1rem = await Span.findAll({
      include: [
        {
          model: Color,
          where: {
            name: 'teal'
          }
        },
        {
          model: Size,
          where: {
            name: '1.0rem'
          }
        }
      ]
    });
    await Promise.all(tealAnd1rem.map( span => span.destroy()));
    const dodgerBlue500 = await Span.findAll({
      include: [
        {
          model: Color,
          where: {
            name: 'dodgerBlue'
          }
        },
        {
          model: Weight,
          where: {
            name: '500'
          }
        }
      ]
    });
    await Promise.all(dodgerBlue500.map( span => span.destroy()));
    
  }

  catch(ex){
    console.log(ex);
  }
};

setup();

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`listening on port ${port}`));
