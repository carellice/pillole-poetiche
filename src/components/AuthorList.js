import React, { useEffect, useState } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import * as PoemUtils from "./../utils/PoemUtils";

const wikipediaTitles = {
  'Zero Calcare': 'Zerocalcare',
  'J. W. Goethe': 'Johann Wolfgang von Goethe',
  'Emily Bronte': 'Emily Brontë',
  'Van Gogh': 'Vincent van Gogh',
  'José Saramango': 'José Saramago',
  'Antoine de Saint-Exupèry': 'Antoine de Saint-Exupéry',
};

const imageCache = new Map();

const getWikipediaTitle = (author) => wikipediaTitles[author] || author;

const fetchAuthorImages = async (authors, signal) => {
  const missingAuthors = authors.filter((author) => !imageCache.has(author));
  const batches = [];

  for (let index = 0; index < missingAuthors.length; index += 50) {
    batches.push(missingAuthors.slice(index, index + 50));
  }

  await Promise.all(batches.map(async (batch) => {
    const titles = batch.map(getWikipediaTitle);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      redirects: '1',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: '160',
      titles: titles.join('|'),
    });
    const response = await fetch(`https://it.wikipedia.org/w/api.php?${params}`, { signal });

    if (!response.ok) throw new Error('Impossibile caricare le immagini degli autori');

    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});
    const titleAliases = new Map([
      ...(data.query?.normalized || []).map(({ from, to }) => [from, to]),
      ...(data.query?.redirects || []).map(({ from, to }) => [from, to]),
    ]);
    const imagesByTitle = new Map(
      pages.map((page) => [page.title.toLocaleLowerCase('it'), page.thumbnail?.source])
    );

    batch.forEach((author) => {
      let resolvedTitle = getWikipediaTitle(author);

      while (titleAliases.has(resolvedTitle)) {
        resolvedTitle = titleAliases.get(resolvedTitle);
      }

      const title = resolvedTitle.toLocaleLowerCase('it');
      imageCache.set(author, imagesByTitle.get(title) || null);
    });
  }));
};

const AuthorList = React.memo(({ authors, onAuthorClick }) => {
  const [authorImages, setAuthorImages] = useState(() =>
    Object.fromEntries(authors.map((author) => [author, imageCache.get(author)]))
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchAuthorImages(authors, controller.signal)
      .then(() => {
        setAuthorImages(Object.fromEntries(
          authors.map((author) => [author, imageCache.get(author)])
        ));
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setAuthorImages({});
        }
      });

    return () => controller.abort();
  }, [authors]);

  return (
    <div className="author-list">
      {authors.map((author) => {
        const count = PoemUtils.getNumberOfPoemsByAuthor(author);
        return (
          <button
            key={author}
            className="author-item"
            onClick={() => onAuthorClick(author)}
          >
            <div className="author-avatar">
              <span aria-hidden="true">{author.charAt(0).toUpperCase()}</span>
              {authorImages[author] && (
                <img
                  src={authorImages[author]}
                  alt={`Ritratto di ${author}`}
                  loading="lazy"
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
            <div className="author-info">
              <div className="author-name">{author}</div>
              <div className="author-count">
                {count} {count === 1 ? 'poesia' : 'poesie'}
              </div>
            </div>
            <div className="author-arrow">
              <ChevronRightIcon />
            </div>
          </button>
        );
      })}
    </div>
  );
});

export default AuthorList;
