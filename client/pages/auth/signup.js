import { useState } from 'react';
import Router from 'next/router';
import UseRequest from '../../hooks/use-request';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { doRequest, errors } = UseRequest({
    url: '/api/users/signup',
    method: 'post',
    body: {
      email,
      password,
    },
    onSuccess: () => Router.push('/'),
  });

  const onSubmit = async (event) => {
    event.preventDefault();

    await doRequest();
  };

  return (
    <div className="container">
      <div className="row align-items-center justify-content-center mt-5">
        <div className="col-lg-6">
          <form onSubmit={onSubmit}>
            <h3 className="mb-4">Sign Up</h3>
            <div className="form-group mb-3">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="text"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errors}
            <div className="row">
              <div className="col-6 ms-auto">
                <div className="d-grid">
                  <button className="btn btn-primary rounded-pill">
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
