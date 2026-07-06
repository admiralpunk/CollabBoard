import styled, { keyframes } from "styled-components"

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`

const SkeletonBlock = styled.div`
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: ${props => props.$radius || "var(--radius-sm)"};
  width: ${props => props.$width || "100%"};
  height: ${props => props.$height || "16px"};
  margin-bottom: ${props => props.$mb || "0"};
`

const Skeleton = (props) => <SkeletonBlock {...props} />

export default Skeleton
