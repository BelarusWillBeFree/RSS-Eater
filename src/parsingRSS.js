const getPostsFromDOM = (items) => {
  const posts = [];
  Array.from(items).forEach((elemItem) => {
    const [title] = Array.from(elemItem.children).filter((node) => node.nodeName === 'title');
    const [link] = Array.from(elemItem.children).filter((node) => node.nodeName === 'link');
    const [description] = Array.from(elemItem.children).filter((node) => node.nodeName === 'description');
    posts.push({
      title: title.textContent,
      link: link.textContent,
      description: description.textContent,
    });
  });
  return posts;
};

const parsingRSS = (inputData, watchedState) => {
  const feed = {};
  const { contents } = inputData;
  const domParser = new DOMParser().parseFromString(contents, 'application/xml');

  if (domParser.querySelector('parsererror') !== null) {
    watchedState.form.status = 'loadingError';
    watchedState.form.error = 'error.loadingError';
    throw new Error();
  }

  feed.title = domParser.querySelector('title').textContent;
  feed.description = domParser.querySelector('description').textContent;
  const items = domParser.querySelectorAll('item');

  const posts = getPostsFromDOM(items);
  return { parsingFeed: feed, parsingPosts: posts };
};

export default parsingRSS;
