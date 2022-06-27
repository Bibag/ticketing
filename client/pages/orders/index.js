import UseRequest from '../../hooks/use-request';
import Link from 'next/link';

const OrderIndex = ({ orders }) => {
  const orderList = orders.map((order) => {
    return (
      <tr key={order.id}>
        <td>
          <Link href="/tickets/[ticketId]" as={`/tickets/${order.ticket.id}`}>
            <a
              style={{
                fontSize: 1.5 + 'rem',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              {order.ticket.title}
            </a>
          </Link>
        </td>
        <td style={{ fontSize: 1.5 + 'rem' }}>{order.quantity}</td>
        <td style={{ fontSize: 1.5 + 'rem', color: 'green' }}>
          ${order.ticket.price}
        </td>
        <td style={{ fontSize: 1.5 + 'rem', color: 'red' }}>
          ${order.ticket.price * order.quantity}
        </td>
        <td>{order.status}</td>
        <td>
          <Link href="/orders/[orderId]" as={`/orders/${order.id}`}>
            <a
              style={{
                fontSize: 1 + 'rem',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              View
            </a>
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <div className="container">
      <div className="row my-5">
        <div className="col">
          <h1 className="mb-3">Orders</h1>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>{orderList}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

OrderIndex.getInitialProps = async (context, client, currentUser) => {
  const { data } = await client.get('/api/orders');

  return { orders: data };
};

export default OrderIndex;
