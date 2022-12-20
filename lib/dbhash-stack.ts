// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dyndb from 'aws-cdk-lib/aws-dynamodb';
import * as cr from 'aws-cdk-lib/custom-resources';
import { faker } from '@faker-js/faker';

interface IPerson {
  pk: { S: string };
  sk: { S: string };//age
  firstName: { S: string };
  lastName: { S: string };
  gender: { S: string };
}

interface IAddress {
  pk: { S: string };
  sk: { S: string };//state
  city: { S: string };
  street: { S: string };
  postcode: { S: string }; 
}

interface IAccount {
  pk: { S: string };
  sk: { S: string };//role
  username: { S: string };
  password: { S: string };
  email: { S: string };
}

export class DbhashStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dyndb.Table(this, "dbHashSortTable", {
      tableName: "dbHashSortTable",
      partitionKey: { name: "pk", type: dyndb.AttributeType.STRING},
      sortKey: { name: "sk", type: dyndb.AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const globalSecondaryIndexProps: dyndb.GlobalSecondaryIndexProps = {
      indexName: 'reverse-index',
      partitionKey: {
        name: 'sk',
        type: dyndb.AttributeType.STRING,
      },
      sortKey: {
        name: 'pk',
        type: dyndb.AttributeType.STRING,
      }
    };

      table.addGlobalSecondaryIndex(globalSecondaryIndexProps);
   
    let batch = this.generateBatch();
    new cr.AwsCustomResource(this, `initDBPersonBatch`, {
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            [table.tableName]: batch.Person
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(`initDBDataBatch1`),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: [table.tableArn] }),
    });

    new cr.AwsCustomResource(this, `initDBAddressBatch`, {
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            [table.tableName]: batch.Address
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(`initDBDataBatch2`),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: [table.tableArn] }),
    });

    new cr.AwsCustomResource(this, `initDBAccountBatch`, {
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            [table.tableName]: batch.Account
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(`initDBDataBatch3`),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: [table.tableArn] }),
    });
    

  }

  private generateBatch = (batchSize = 25): { 
    Person: { PutRequest: { Item: IPerson } }[], 
    Address: { PutRequest: { Item: IAddress } }[],
    Account: { PutRequest: { Item: IAccount } }[] 
  } => {
    let arr = new Array(batchSize).fill(undefined).map(() => {
      return { PutRequest: { Item: this.generatePersonItem() } }
    });
    return {
      Person: arr,
      Address: arr.map((el) => {return {PutRequest: { Item: this.generateAddressItem(el.PutRequest.Item.pk.S)}}}),
      Account: arr.map((el) => {return {PutRequest: { Item: this.generateAccountItem(el.PutRequest.Item.pk.S)}}})
    }
  };

  private generatePersonItem = (): IPerson => {
    return {
      pk: { S: `userId#${faker.datatype.uuid()}` },
      sk: { S: `age#${faker.datatype.number({ max: 50, min: 18, precision: 0.1 })}`},
      firstName: { S: faker.name.firstName() },
      lastName: { S: faker.name.lastName() },
      gender: { S: faker.name.gender() },
    };
  };

  private generateAddressItem = (id:string): IAddress => {
    return {
      pk: { S: id },
      sk: { S: `state#${faker.address.state()}`},
      city: { S: faker.address.cityName() },
      street: { S: faker.address.streetAddress() },
      postcode: { S: faker.address.zipCode() },
    };
  };

  private generateAccountItem = (id:string): IAccount => {
    return {
      pk: { S: id },
      sk: { S: `role#${faker.helpers.arrayElement(['admin', 'superuser', 'user']) }`},
      username: { S: faker.internet.userName() },
      password: { S: faker.internet.password() },
      email: { S: faker.internet.email() },
    };
  };
}
