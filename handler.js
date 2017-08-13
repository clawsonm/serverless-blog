'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event
    })
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

module.exports.getPost = (event, context, callback) => {
  let slug = event.pathParameters.slug;
  const params = {
    TableName: process.env.POSTS_TABLE,
    Key: {
      slug: slug
    }
  };
  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(new Error(`Couldn't fetch post: ${slug}.`));
      return;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };

    callback(null, response);
  });
};

module.exports.listPosts = (event, context, callback) => {
  dynamoDb.scan({TableName: process.env.POSTS_TABLE}, (error, result) => {
    if (error) {
      console.error(error);
      callback(new Error('Couldn\'t fetch posts.'));
      return;
    }
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        count: result.Items.length,
        posts: result.Items
      })
    };
    callback(null, response);
  });
};

module.exports.getCommentsForPost = (event, context, callback) => {
  let slug = event.pathParameters.slug;
  let params = {
    TableName: process.env.COMMENTS_TABLE,
    Key: {
      slug: slug
    }
  };
  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(new Error('Couldn\'t fetch comments.'));
      return;
    }
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        count: result.Items.length,
        comments: result.Items
      })
    };
    callback(null, response);
  });
};

module.exports.commentOnPost = (event, context, callback) => {
  const timestamp = new Date().getTime();
  let slug = event.pathParameters.slug;
  let data = JSON.parse(event.body);
  if (typeof data.name !== 'string' || typeof data.body !== 'string') {
    console.error('Validation failed');
    callback(new Error(`Validation failed while commenting on post: ${slug}`));
    return;
  }

  const params = {
    TableName: process.env.COMMENTS_TABLE,
    Item: {
      slug: slug,
      comment_id: uuid.v1(),
      name: data.name,
      body: data.body,
      created: timestamp,
      updated: timestamp
    }
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.error(error);
      callback(new Error(`Failed to comment on post: ${slug}`));
      return;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item)
    };
    callback(null, response);
  });
};