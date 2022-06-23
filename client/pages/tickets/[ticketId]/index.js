import UseRequest from '../../../hooks/use-request';
import Router from 'next/router';
import { useState } from 'react';

const TicketShow = ({ currentUser, ticket }) => {
  const [purchaseClickStatus, setPurchaseClickStatus] = useState(false);

  const { doRequest, errors } = UseRequest({
    url: '/api/orders',
    method: 'post',
    body: {
      ticketId: ticket.id,
    },
    onSuccess: (order) =>
      Router.push('/orders/[orderId]', `/orders/${order.id}`),
  });

  const onClickPurchase = async (event) => {
    event.preventDefault();

    setPurchaseClickStatus(true);

    await doRequest();

    setPurchaseClickStatus(false);
  };

  return (
    <div className="container">
      <div className="row my-5">
        <div className="col">
          <div>
            <h1>{ticket.title}</h1>
            <h4 className="mb-3">Price: {ticket.price}</h4>
          </div>
          {errors}
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
