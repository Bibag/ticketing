import { useState } from 'react';
import Router from 'next/router';
import UseRequest from '../../hooks/use-request';

const UpdatePassword = ({ currentUser }) => {
  const email = currentUser.email;
  const [password, setPassword] = useState('');
  const { doRequest, errors } = UseRequest({
    url: '/api/users/updatepassword',
    method: 'put',
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
            <h3 className="mb-4">Change Password</h3>
            <div className="form-group mb-3">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="text"
                className="form-control"
                value={email}
                disabled
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="password">New Password</label>
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
                  <button className="btn btn-primary rounded-pill">Save</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
