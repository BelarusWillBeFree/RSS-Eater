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

const parsingRSS = (contents) => {
  const feed = {};
  const domParser = new DOMParser().parseFromString(contents, 'application/xml');

  const title = domParser.querySelector('title');
  const description = domParser.querySelector('description');
  const items = domParser.querySelectorAll('item');

  feed.title = title?.textContent;
  feed.description = description?.textContent;

  const posts = getPostsFromDOM(items);
  return { parsingFeed: feed, parsingPosts: posts };
};

export default parsingRSS;
