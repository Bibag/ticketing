import { useState } from 'react';
import UseRequest from '../../../hooks/use-request';
import Router from 'next/router';

const TicketUpdate = ({ ticket }) => {
  const [title, setTitle] = useState(ticket.title);
  const [price, setPrice] = useState(ticket.price);
  const [quantity, setQuantity] = useState(ticket.quantity);
  const [updateClickStatus, setUpdateClickStatus] = useState(false);

  const onBlur = () => {
    const value = parseFloat(price);

    if (isNaN(value)) {
      return;
    }

    setPrice(value.toFixed(2));
  };

  const { doRequest, errors } = UseRequest({
    url: `/api/tickets/${ticket.id}`,
    method: 'put',
    body: {
      title,
      price,
      quantity,
    },
    onSuccess: (ticket) =>
      Router.push('/tickets/[ticketId]', `/tickets/${ticket.id}`),
  });

  const onSubmit = async (event) => {
    event.preventDefault();

    setUpdateClickStatus(true);

    await doRequest();

    setUpdateClickStatus(false);
  };

  return (
    <div className="container">
      <div className="row align-items-center justify-content-center my-5">
        <div className="col-lg-6">
          <form onSubmit={onSubmit}>
            <h1 className="mb-4">Update Ticket</h1>
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
              <label htmlFor="price">Quantity</label>
              <input
                id="quantity"
                type="text"
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            {errors}
            <div className="row">
              <div className="col-6 ms-auto">
                <div className="d-grid">
                  <button
                    className="btn btn-primary rounded-pill"
                    disabled={updateClickStatus}
                  >
                    Update
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

TicketUpdate.getInitialProps = async (context, client, currentUser) => {
  const { ticketId } = context.query;

  const { data } = await client.get(`/api/tickets/${ticketId}`);

  return { ticket: data };
};

export default TicketUpdate;
