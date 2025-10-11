import { Button } from "antd";
import { UploadOutlined, SaveOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';

  export const CustomPrevArrow = (props) => {
    const { onClick } = props;
    return (
      <Button
        type="primary"
        shape="circle"
        icon={<LeftOutlined />}
        onClick={onClick}
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
        }}
      />
    );
  };

 export const CustomNextArrow = (props) => {
    const { onClick } = props;
    return (
      <Button
        type="primary"
        shape="circle"
        icon={<RightOutlined />}
        onClick={onClick}
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
        }}
      />
    );
  };