import { useState } from 'react';
import Router from 'next/router';
import UseRequest from '../../hooks/use-request';

const NewTicket = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const onBlur = () => {
    const value = parseFloat(price);

    if (isNaN(value)) {
      return;
    }

    setPrice(value.toFixed(2));
  };

  const { doRequest, errors } = UseRequest({
    url: '/api/tickets',
    method: 'post',
    body: {
      title,
      price,
      quantity,
    },
    onSuccess: (ticket) => Router.push('/'),
  });

  const onSubmit = async (event) => {
    event.preventDefault();

    await doRequest();
  };

  return (
    <div className="container">
      <div className="row align-items-center justify-content-center my-5">
        <div className="col-lg-6">
          <form onSubmit={onSubmit}>
            <h1 className="mb-4">Create new Ticket</h1>
            <div className="form-group mb-3">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                type="text"
                className="form-control"
                value={price}
                onBlur={onBlur}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="text"
                className="form-control"
                value={quantity}
                onBlur={onBlur}
                onChange={(e) => setQuantity(e.target.value)}
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

export default NewTicket;
