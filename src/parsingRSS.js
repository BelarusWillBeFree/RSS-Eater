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
  const { contents } = inputData.data;
  const rssContent = new DOMParser().parseFromString(contents, 'application/xml');

  if (rssContent.querySelector('parsererror')) {
    watchedState.form.status = 'parsingError';
    watchedState.form.information = 'error.parsingError';
    throw new Error('parsingError');
  }

  feed.title = rssContent.querySelector('title').textContent;
  feed.description = rssContent.querySelector('description').textContent;
  const items = rssContent.querySelectorAll('item');

  const posts = getPostsFromDOM(items);
  return { parsingFeed: feed, parsingPosts: posts };
};

export default parsingRSS;
