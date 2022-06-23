process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios').default;

const cookie =
  'session=eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcFpDSTZJall5WVRnd01qUmpPVFkyWlRZNU9XVXpaR05qTURJNE5DSXNJbVZ0WVdsc0lqb2lNakl5TWtCbkxtTnZiU0lzSW1saGRDSTZNVFkxTlRFNE1qZzFOMzAuREhDYTdINkM3amFvZ2Juc21NcGlSc0hRV2E2SXo4Q3E2Mm54Y0ZsRmNhcyJ9';

const doRequest = async () => {
  try {
    const { data } = await axios.post(
      `https://ticketing.dev/api/tickets`,
      {
        title: 'ticketRepeatTests',
        price: 5,
      },
      {
        headers: { cookie },
      }
    );

    await axios.put(
      `https://ticketing.dev/api/tickets/${data.id}`,
      {
        title: 'ticketRepeatTests',
        price: 10,
      },
      {
        headers: { cookie },
      }
    );

    await axios.put(
      `https://ticketing.dev/api/tickets/${data.id}`,
      {
        title: 'ticketRepeatTests',
        price: 15,
      },
      {
        headers: { cookie },
      }
    );

    await axios.put(
      `https://ticketing.dev/api/tickets/${data.id}`,
      {
        title: 'ticketRepeatTests',
        price: 20,
      },
      {
        headers: { cookie },
      }
    );

    await axios.put(
      `https://ticketing.dev/api/tickets/${data.id}`,
      {
        title: 'ticketRepeatTests',
        price: 25,
      },
      {
        headers: { cookie },
      }
    );
  } catch (error) {
    console.log(error.response.data.errors);
  }
};

const index = [];

for (let i = 1; i <= 200; i++) {
  index.push(i);
}

Promise.all(index.map((i) => doRequest()));
