import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import {UserModel} from '../src/models/Users.js'; 
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../src/index.js'; 
import mongoose from 'mongoose';
import { describe, it, before, after } from 'mocha';
import { RecipesModel } from '../src/models/Recipes.js';
import axios from 'axios';
chai.use(chaiHttp);
describe('TESTING FOR REGISTER COMPONENT', () => {
  let findOneStub;
  let hashStub;
  let saveStub;

  beforeEach(() => {
    findOneStub = sinon.stub(UserModel, 'findOne');
    hashStub = sinon.stub(bcrypt, 'hash');
    saveStub = sinon.stub(UserModel.prototype, 'save');
  });

  afterEach(() => {
    findOneStub.restore();
    hashStub.restore();
    saveStub.restore();
  });

  it('should return "Username already exists" if username is taken', async () => {
    findOneStub.resolves({ username: 'shux' });

    const response = await chai.request(app)
      .post('/auth/register')
      .send({ username: 'shux', password: '1234' });

    expect(response).to.have.status(400);
    expect(response.body.message).to.equal('Username already exists');
  });

  it('should return "User registered successfully" when registering a new user', async () => {
    findOneStub.resolves(null);
    hashStub.resolves('hashedPassword');
    saveStub.resolves({ username: 'newUser', password: 'hashedPassword' });

    const response = await chai.request(app)
      .post('/auth/register')
      .send({ username: 'newUser', password: 'somePassword' });

    expect(response).to.have.status(200);
    expect(response.body.message).to.equal('User registered successfully');
  });

  it('should return "Something Went Wrong" if an error occurs during registration', async () => {
    findOneStub.rejects(new Error('Database error'));

    const response = await chai.request(app)
      .post('/auth/register')
      .send({ username: 'newUser', password: 'somePassword' });

    expect(response).to.have.status(500);
    expect(response.body.message).to.equal('Something Went Wrong');
  });
});



describe('TESTING FOR LOGIN COMPONENT', () => {
    let findOneStub;
    let compareStub;
    let signStub;
  
    beforeEach(() => {
      findOneStub = sinon.stub(UserModel, 'findOne');
      compareStub = sinon.stub(bcrypt, 'compare');
      signStub = sinon.stub(jwt, 'sign');
    });
  
    afterEach(() => {
      findOneStub.restore();
      compareStub.restore();
      signStub.restore();
    });
  
    it('should return "Username or password is incorrect" if username is not found', async () => {
      findOneStub.resolves(null);
  
      const response = await chai.request(app)
        .post('/auth/login')
        .send({ username: 'shun', password: '1234' });
  
      expect(response).to.have.status(400);
      expect(response.body.message).to.equal('Username or password is incorrect');
    });
  
    it('should return "Username or password is incorrect" if password is invalid', async () => {
      findOneStub.resolves({ username: 'shux', password: '1234' });
      compareStub.resolves(false);
  
      const response = await chai.request(app)
        .post('/auth/login')
        .send({ username: 'shux', password: '1345' });
  
      expect(response).to.have.status(400);
      expect(response.body.message).to.equal('Username or password is incorrect');
    });
  
    it('should return a token and userID on successful login', async () => {
      const mockUser = { _id: 'user_id', username: 'shux', password: '1234' };
      findOneStub.resolves(mockUser);
      compareStub.resolves(true);
      signStub.returns('mockToken');
  
      const response = await chai.request(app)
        .post('/auth/login')
        .send({ username: 'shux', password: '1234' });
      
      expect(response).to.have.status(200);
      expect(response.body).to.have.property('token', 'mockToken');
      expect(response.body).to.have.property('userID', 'user_id');
    });
  });

const testDBUrl = "mongodb+srv://shux:ayantika@cluster0.bkaw5xv.mongodb.net/recipetest?retryWrites=true&w=majority"

describe('TESTING FOR RECIPES COMPONENT', () => {
  before(async () => {
    // Connect to the test database
    try {
      // console.log('Connecting to the database...');
      await mongoose.connect(testDBUrl, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Database connection successful.');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error; // Rethrow the error to fail the test setup
    }
  });

  after(async () => {
    // Disconnect from the test database after all tests are completed
    await mongoose.connection.close();
  });

  describe('GET /recipes', () => {
    it('should get all recipes', async () => {
      const response = await chai.request(app).get('/recipes');
      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
    }).timeout(5000);
  });

  describe('POST /recipes', () => {
    it('should throw 401 unauthorized while creating a new recipe without logging in', async () => {
      const newRecipe = {
        name: 'Test Recipe',
        ingredients: [
          "Test Ingredient1",
          "Test Ingredient2",
        ],
        instructions:"Test Instruction",
        imageUrl: "https://kitchenofdebjani.com/wp-content/uploads/2022/09/Dak-Bungalow-Chicken-Curry-recipe-debjanir-rannaghar.jpg",
        cookingTime: 200
      };
      
      const response = await chai.request(app).post('/recipes').send(newRecipe);
      expect(response).to.have.status(401);
      // Add more assertions based on your response structure
    }).timeout(5000);
    
    it('should create a new recipe', async () => {
      
      const response = await chai.request(app)
        .post('/auth/login')
        .send({ username: 'shux', password: '1234' });
        const req = {
          body: {
            name: 'Test Recipe',
            ingredients: [
              "Test Ingredient1",
              "Test Ingredient2",
            ],
            instructions:"Test Instruction",
            imageUrl: "https://kitchenofdebjani.com/wp-content/uploads/2022/09/Dak-Bungalow-Chicken-Curry-recipe-debjanir-rannaghar.jpg",
            cookingTime: 200,
            userOwner: "65643a52e2f97f6a29bf6083"
          }
        };
      const res = await chai.request(app)
        .post('/recipes')
        .set('Authorization', response._body.token) // Attach a mock token
        .send(req.body);
  
      // Assertions
      expect(res).to.have.status(201);
      expect(res.body.createdRecipe).to.have.property('name', 'Test Recipe');
      expect(res.body.createdRecipe).to.have.property('_id');
    }).timeout(5000);
  });

  describe('GET /recipes/:recipeId', () => {
    it('should get a recipe by ID', async () => {
      const existingRecipe = await RecipesModel.findOne(); // Assuming there is at least one recipe in the database

      const response = await chai.request(app).get(`/recipes/${existingRecipe._id}`);
      expect(response).to.have.status(200);
      expect(response.body).to.have.property('_id', existingRecipe._id.toString());
      // Add more assertions based on your response structure
    }).timeout(5000);
  });

  // Add similar tests for other routes (e.g., PUT, GET saved recipes, etc.)
});
