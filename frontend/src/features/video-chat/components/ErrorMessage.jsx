import styled from "styled-components";

const ErrorContainer = styled.div`
  color: #d32f2f;
  background: #ffebee;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
`;

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  
  return (
    <ErrorContainer>
      Failed to access camera/microphone: {message}
    </ErrorContainer>
  );
};

export default ErrorMessage; 