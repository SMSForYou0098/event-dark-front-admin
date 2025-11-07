import React from "react";
import { Card, Radio, Row, Col } from "antd";
import { Link } from "react-router-dom";
import { ROW_GUTTER } from "constants/ThemeConstant";

/**
 * SelectableCardGroup
 *
 * @param {Array} options - [{ value, title, description?, icon?, navigation?, href? }]
 * @param {string} value - Currently selected value
 * @param {function} onChange - Callback when selection changes
 * @param {number} columns - Number of columns per row (default: 2)
 */
const SelectableCardGroup = ({
  options = [],
  value,
  onChange,
  columns = 2,
}) => {
  const handleSelect = (val) => {
    if (onChange) onChange(val);
  };

  return (
    <Radio.Group
      onChange={(e) => handleSelect(e.target.value)}
      value={value}
      style={{ width: "100%" }}
    >
      <Row gutter={ROW_GUTTER}>
        {options.map((opt) => {
          const cardContent = (
            <Card
              hoverable
              className={`w-100 border ${value === opt.value ? "border-primary shadow-sm" : ""
                }`}
            >
              <Row>
                <Col>
                  <Row align="middle" gutter={ROW_GUTTER}>
                    {opt.icon && (
                      <Col>
                        <div className="text-primary" style={{ fontSize: "24px" }}>
                          {opt.icon}
                        </div>
                      </Col>
                    )}
                    <Col>
                      <Card.Meta
                        title={opt.title}
                        description={
                          opt.description && (
                            <span className="text-muted">{opt.description}</span>
                          )
                        }
                      />
                    </Col>
                  </Row>
                </Col>
                <Col className="d-flex opacity-0">
                  <Radio value={opt.value} />
                </Col>
              </Row>
            </Card>
          );

          return (
            <Col
              md={6}
              xs={24}
              key={opt.value}
              className="d-flex justify-content-center"
              onClick={() => handleSelect(opt.value)}
            >
              {opt.navigation && opt.href ? (
                <Link to={`${opt.href}`} className="w-100">
                  {cardContent}
                </Link>
              ) : (
                cardContent
              )}
            </Col>
          );
        })}
      </Row>
    </Radio.Group>
  );
};

export default SelectableCardGroup;
