import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();
  const words = post?.data.content
    .reduce((acc, value) => {
      const { heading } = value;
      const body = RichText.asText(value.body);

      return acc.concat(heading, body);
    }, '')
    .split(' ');

  const readingTime = Math.ceil(words?.length / 200);
  return (
    <>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>

      <Header />

      {isFallback ? (
        <div>
          <h1>Carregando...</h1>
        </div>
      ) : (
        <>
          <div className={styles.banner}>
            <img src={post?.data.banner.url} alt="banner" />
          </div>
          <main className={styles.container}>
            <article className={styles.content}>
              <h1>{post?.data.title}</h1>
              <div>
                <FiCalendar />
                <time>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
                <FiUser />
                <span>{post?.data.author}</span>
                <FiClock />
                <span>{readingTime} min</span>
              </div>

              {post?.data.content.map(content => (
                <>
                  <strong key={content.heading.length}>
                    {content.heading}
                  </strong>
                  {content.body.map(body => (
                    <p key={body.text.length}>{body.text}</p>
                  ))}
                </>
              ))}
            </article>
          </main>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  const params = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return { paths: params, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  // Post não encontrado
  if (!response || !response?.data) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const post: Post = {
    first_publication_date: response.first_publication_date,
    data: response?.data,
    uid: response.uid,
  };

  return {
    props: {
      post,
    },
  };
};
