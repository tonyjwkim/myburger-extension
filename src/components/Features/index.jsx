import styled from "styled-components";

function Features() {
  return (
    <FeaturesContainer>
      <Header>Features</Header>
      <FeatureBlock>Focus Mode</FeatureBlock>
      <FeatureBlock>Visual Filters</FeatureBlock>
    </FeaturesContainer>
  );
}

const FeaturesContainer = styled.div`
  background-color: #f2f2f2;
  border-radius: 8px;
  padding: 20px;
  width: 250px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: black;
`;

const Header = styled.h2`
  font-size: 20px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  margin-bottom: 15px;
`;

const FeatureBlock = styled.div`
  margin-bottom: 15px;
  &:last-child {
    margin-bottom: 0;
  }
`;

export default Features;
