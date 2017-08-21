'use strict';

// const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = (slug) => {
  const params = {
    TableName: process.env.POSTS_TABLE,
    Key: {
      slug: slug
    }
  };
  return new Promise((resolve, reject) => {
    dynamoDb.get(params, (error, result) => {
      if (error) {
        reject(error);
      }
      if (Object.keys(result).length == 0) {
        resolve(false);
      } else {
        resolve(result.Item);
      }
    });
  });
};

module.exports.list = () => {
  return new Promise((resolve, reject) => {
    dynamoDb.scan({TableName: process.env.POSTS_TABLE}, (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result.Items);
    });
  });
};