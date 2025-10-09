import React, { memo } from "react";
import { Card } from "antd";
import { Link } from "react-router-dom";

const { Meta } = Card;

const PosEventCard = memo((props) => {
  return (
    <div className="animate:hover-media" style={{ cursor: "pointer" }}>
      <Card
        hoverable
        cover={
          <Link to="#">
            <img
              alt="product-details"
              src={props.productImage}
              className="img-fluid rounded-4"
            />
          </Link>
        }
        bodyStyle={{ padding: "0.5rem 1rem" }}
        className="rounded-4"
      >
        <Meta
          title={
            <Link to="#" className="h6 iq-product-detail text-truncate d-block mb-0">
              {props.productName}
            </Link>
          }
        />
      </Card>
    </div>
  );
});

PosEventCard.displayName = "PosEventCard";
export default PosEventCard;
