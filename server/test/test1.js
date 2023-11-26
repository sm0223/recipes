import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import {UserModel} from '../src/models/Users.js'; 
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../src/index.js'; 

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



describe('POST /login', () => {
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