import UseRequest from '../../../hooks/use-request';
import Router from 'next/router';
import { useState } from 'react';

const TicketShow = ({ currentUser, ticket }) => {
  const [quantity, setQuantity] = useState('');
  const [purchaseClickStatus, setPurchaseClickStatus] = useState(false);

  const onBlur = () => {
    const value = parseInt(quantity);

    if (isNaN(value)) {
      return;
    }

    setQuantity(value);
  };

  const purchaseRequest = UseRequest({
    url: '/api/orders',
    method: 'post',
    body: {
      ticketId: ticket.id,
      quantity,
    },
    onSuccess: (order) =>
      Router.push('/orders/[orderId]', `/orders/${order.id}`),
  });

  const onClickPurchase = async (event) => {
    event.preventDefault();

    setPurchaseClickStatus(true);

    await purchaseRequest.doRequest();

    setPurchaseClickStatus(false);
  };

  const onClickDeleteTicketHandler = async (event) => {
    event.preventDefault();
  };

  return (
    <div className="container">
      <div className="row my-5">
        <div className="col">
          <div>
            <h1>{ticket.title}</h1>
            <h4 className="mb-3">Price: ${ticket.price}</h4>
            <h6 className="mb-3">Stock: {ticket.availableQuantity}</h6>
            <div className="form-group mb-3 d-inline-block">
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
          </div>
          {purchaseRequest.errors}
          <button
            style={{ width: 10 + 'rem' }}
            className="btn btn-primary rounded-pill me-3"
            onClick={onClickPurchase}
            disabled={purchaseClickStatus}
          >
            Purchase
          </button>
          {ticket.userId === currentUser.id && (
            <button
              style={{ width: 10 + 'rem' }}
              className="btn btn-warning  rounded-pill"
              onClick={(event) =>
                Router.push(
                  '/tickets/[ticketId]/edit',
                  `/tickets/${ticket.id}/edit`
                )
              }
            >
              Update
            </button>
          )}
          {ticket.userId === currentUser.id && (
            <button
              style={{ width: 10 + 'rem' }}
              className="btn btn-danger rounded-pill"
              onClick={onClickDeleteTicketHandler}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

TicketShow.getInitialProps = async (context, client, currentUser) => {
  const { ticketId } = context.query;
  const { data } = await client.get(`/api/tickets/${ticketId}`);
  return { ticket: data };
};

export default TicketShow;
