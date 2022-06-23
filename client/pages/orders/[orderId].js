import { useState, useEffect } from 'react';
import UseRequest from '../../hooks/use-request';
import StripeCheckout from 'react-stripe-checkout';
import Router from 'next/router';

const OrderDetail = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [payClickStatus, setPayClickStatus] = useState(false);
  const [deleteClickStatus, setDeleteClickStatus] = useState(false);

  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft / 1000));
    };

    findTimeLeft();

    const timerId = setInterval(() => {
      findTimeLeft();
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const payOrder = UseRequest({
    url: '/api/payments',
    method: 'post',
    body: {
      orderId: order.id,
    },
    onSuccess: (payment) => Router.push('/orders'),
  });

  const deleteOrder = UseRequest({
    url: `/api/orders/${order.id}`,
    method: 'delete',
    body: {},
    onSuccess: (payment) => Router.push('/orders'),
  });

  const onClickDeleteOrder = async (event) => {
    event.preventDefault();

    setDeleteClickStatus(true);

    await deleteOrder.doRequest();

    setDeleteClickStatus(false);
  };

  return (
    <div className="container">
      <div className="row  my-5">
        <div className="col">
          <h1>Purchasing {order.ticket.title}</h1>
          <div className="mb-3">
            {timeLeft > 0 ? (
              <div>
                You have {timeLeft} seconds left to pay until order expires
              </div>
            ) : (
              <div>Order expired</div>
            )}
          </div>
          {payOrder.errors}
          {deleteOrder.errors}

          <div style={{ display: 'inline-block', marginRight: 1 + 'rem' }}>
            <StripeCheckout
              token={({ id }) => payOrder.doRequest({ token: id })}
              stripeKey="pk_test_51LCy21BrPgNinwicOo66oSllaRYEuwKm2SdBx37JgyPWNCcKJ8IQtnJurFW697sSrkxcW8iZezo9NIGYUGVVQXp400SXEmFnQP"
              amount={order.ticket.price * 100}
              email={currentUser.email}
            />
          </div>

          <button
            style={{ display: 'inline-block', width: 6 + 'rem' }}
            className="btn btn-danger rounded-pill"
            onClick={onClickDeleteOrder}
            disabled={deleteClickStatus}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

OrderDetail.getInitialProps = async (context, client, currentUser) => {
  const { orderId } = context.query;

  const { data } = await client.get(`/api/orders/${orderId}`);

  return { order: data };
};

export default OrderDetail;
