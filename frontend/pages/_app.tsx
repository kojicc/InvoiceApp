


import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';



import type { AppProps } from 'next/app';
import Head from 'next/head';
import { SWRConfig } from 'swr';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { fetcher } from '@/lib/swr';
import { theme } from '../theme';


export default function App({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig value={{ fetcher }}>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <Notifications />
          <Head>
            <title>Invoice Management System</title>
            <meta
              name="viewport"
              content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
            />
            <link rel="shortcut icon" href="/invoice-icon.png" />
          </Head>
          <Component {...pageProps} />
        </ModalsProvider>
      </MantineProvider>
    </SWRConfig>
  );
}