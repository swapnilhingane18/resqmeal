import { useState } from "react";
import RoleSelection from "./RoleSelection";
import ImpactDashboard from "./ImpactDashboard";
import AddFood from "./AddFood";
import NGOFeed from "./NGOFeed";

function App() {
  const [step, setStep] = useState("role");

  if (step === "role") {
    return (
      <RoleSelection
        onSelect={(role) =>
          setStep(role === "provider" ? "addFood" : "ngoFeed")
        }
      />
    );
  }

  if (step === "addFood") {
    return <AddFood onSubmit={() => setStep("dashboard")} />;
  }

  if (step === "ngoFeed") {
    return <NGOFeed />;
  }

  return <ImpactDashboard />;
}

export default App;
