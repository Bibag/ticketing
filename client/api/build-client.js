import axios from 'axios';

const BuildClient = ({ req }) => {
  if (typeof window === 'undefined') {
    //we are on the server

    return axios.create({
      baseURL: 'http://www.tiki-ticket.shop/',
      headers: req.headers,
    });
  } else {
    //we are on the browser

    return axios.create({
      baseURL: '/',
    });
  }
};

export default BuildClient;
