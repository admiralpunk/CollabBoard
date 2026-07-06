import styled, { keyframes } from "styled-components"

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`

const SkeletonBlock = styled.div`
  background: linear-gradient(90deg, var(--color-gray-300) 25%, var(--color-gray-100) 50%, var(--color-gray-300) 75%);
  background-size: 200px 100%;
  animation: ${shimmer} 1.8s ease-in-out infinite;
  border-radius: ${props => props.$radius || "var(--radius-sm)"};
  width: ${props => props.$width || "100%"};
  height: ${props => props.$height || "16px"};
  margin-bottom: ${props => props.$mb || "0"};
`

const Skeleton = (props) => <SkeletonBlock {...props} />

export default Skeleton
