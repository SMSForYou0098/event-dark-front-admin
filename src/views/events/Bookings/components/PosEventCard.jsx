import React, { memo } from "react";
import { Card, Image } from "antd";
import { Link } from "react-router-dom";

const { Meta } = Card;

const PosEventCard = memo((props) => {
  const { isSelected = false, productName, productImage} = props;
  return (
    <div className={`animate:hover-media ${isSelected ? 'selected' : ''}`} style={{ cursor: "pointer" }}>
      <Card
        hoverable
        cover={
          <Link to="#">
            <Image
              alt="product-details"
              src={productImage}
              preview={false}
              className="img-fluid rounded-4"
            />
          </Link>
        }
        bodyStyle={{ padding: "0.5rem 1rem" }}
        className={`rounded-4 ${isSelected ? "pos-event-card-selected" : ""}`}
      >
        <Meta
          className="text-center"
          title={
            <Link to="#" className="text-center h5">
              {productName}
            </Link>
          }
        />
      </Card>
    </div>
  );
});

PosEventCard.displayName = "PosEventCard";
export default PosEventCard;
