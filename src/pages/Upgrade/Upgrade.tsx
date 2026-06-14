import { useEffect } from "react";
import generateGene from "../App/generateGene";

const Upgrade = () => {
  useEffect(() => {
    const bloodweb = generateGene();
    console.log(bloodweb);
  }, []);
  return <div></div>;
};

export default Upgrade;
