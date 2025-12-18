import React from 'react';
import { Card, Button, Typography, Tag, List } from 'antd';
import { ShoppingCartOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const SamuiStarterPack = () => {
  const product = {
    name: "Samui Starter Pack",
    description: "The definitive digital survival kit for Koh Samui arrivals.",
    price: 1.00,
    currency: "USD",
    features: [
      "Verified Taxi Rate Cards (Avoid Scams)",
      "Essential Local Apps Repository",
      "24/7 Emergency Contact List (Police, Hospital, Tourist Police)",
      "'First 24 Hours' Optimization Guide"
    ]
  };

  const handlePurchase = () => {
    console.log("Processing transaction for: " + product.name);
    // Payment gateway integration logic here
  };

  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
      <Card 
        hoverable
        style={{ width: 400, borderRadius: '12px', overflow: 'hidden' }}
        cover={
          <div style={{ background: '#0050b3', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>KOH SAMUI</Title>
          </div>
        }
        actions={[
          <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={handlePurchase} block>
            Buy Now - ${product.price}
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Tag color="gold">BESTSELLER</Tag>
          <Title level={3} style={{ marginTop: '10px' }}>{product.name}</Title>
          <Paragraph type="secondary">{product.description}</Paragraph>
        </div>

        <List
          size="small"
          dataSource={product.features}
          renderItem={item => (
            <List.Item>
              <Text><CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} /> {item}</Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default SamuiStarterPack;