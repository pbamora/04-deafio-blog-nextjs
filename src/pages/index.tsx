import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { FiUser, FiCalendar } from 'react-icons/fi';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function Home({ postsPagination }: HomeProps) {
  const [
    statePostsPagination,
    setStatePostsPagination,
  ] = useState<PostPagination>(postsPagination);

  async function loadMorePosts(): Promise<void> {
    const response = await fetch(postsPagination.next_page);
    const json = await response.json();
    const { results } = json;

    const temp: PostPagination = {
      ...statePostsPagination,
      next_page: results.next_page,
    };

    results.forEach(result => {
      const post: Post = {
        first_publication_date: result.first_publication_date,
        data: result?.data,
        uid: result.uid,
      };

      temp.results.push(post);
    });
    setStatePostsPagination(temp);
  }
  return (
    <>
      <Head>
        <title>Home | spacetravelling</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <div className={styles.posts}>
          {statePostsPagination?.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post?.data.title}</strong>
                <p>{post?.data.subtitle}</p>
                <div>
                  <FiCalendar />
                  <time>
                    {format(
                      new Date(post?.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </time>
                  <FiUser />
                  <span>{post?.data.author}</span>
                </div>
              </a>
            </Link>
          ))}

          {statePostsPagination.next_page && (
            <button type="button" onClick={loadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 1 }
  );

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: post?.data,
      };
    }),
  };

  return {
    props: {
      postsPagination,
    },
  };
};
