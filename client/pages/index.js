import Link from 'next/link';

const LandingPage = ({ currentUser, tickets }) => {
  const ticketList = tickets.map((ticket, index) => {
    return (
      <tr key={`ticket-${index}`}>
        <td>
          <Link href="/tickets/[ticketId]" as={`/tickets/${ticket.id}`}>
            <a
              style={{
                fontSize: 1.5 + 'rem',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              {ticket.title}
            </a>
          </Link>
        </td>
        <td>
          <span style={{ fontSize: 1.5 + 'rem', color: 'green' }}>
            ${ticket.price}
          </span>
        </td>
        <td>
          <Link href="/tickets/[ticketId]" as={`/tickets/${ticket.id}`}>
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
          <h1>Tickets</h1>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>{ticketList}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

LandingPage.getInitialProps = async (context, client, currentUser) => {
  const { data } = await client.get('/api/tickets');

  return { tickets: data };
};

export default LandingPage;
