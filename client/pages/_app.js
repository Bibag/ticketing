import Head from 'next/head';
import 'bootstrap/dist/css/bootstrap.css';
import BuildClient from '../api/build-client';
import Header from '../component/header';

const AppComponent = ({ Component, pageProps, currentUser }) => {
  return (
    <>
      <Head>
        <title>Buy and Sell Ticket</title>
        <link rel="shortcut icon" href="/static/favicon.ico" />
      </Head>
      <Header currentUser={currentUser} />
      <Component currentUser={currentUser} {...pageProps} />
    </>
  );
};

AppComponent.getInitialProps = async (appContext) => {
  try {
    const client = BuildClient(appContext.ctx);
    const { data } = await client.get('/api/users/currentuser');

    let pageProps = {};
    if (appContext.Component.getInitialProps) {
      pageProps = await appContext.Component.getInitialProps(
        appContext.ctx,
        client,
        data.currentUser
      );
    }

    return {
      pageProps,
      ...data,
    };
  } catch (error) {
    console.log('[In _app] Something went wrong!');
  }

  return {};
};

export default AppComponent;
