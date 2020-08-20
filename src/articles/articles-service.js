const ArticlesService = {
  getAllArticles(knex) {
    // return Promise.resolve('all the articles');
    return knex.select('*').from('blogful_articles');
  },
  insertArticle(knex, newArticle) {
    // return Promise.resolve({});
    return knex
      .insert(newArticle)
      .into('blogful_articles')
      .returning('*')
      .then((rows) => {
        return rows[0];
      });
  },
  getById(knex, id) {
    return knex.from('blogful_articles').select('*').where('id', id).first();
  },
  deleteArticle(knex, id) {
    return knex('blogful_articles').where({ id }).delete();
  },
  updateArticle(knex, id, newArticleFields) {
    return knex('blogful_articles').where({ id }).update(newArticleFields);
  },
};

module.exports = ArticlesService;
