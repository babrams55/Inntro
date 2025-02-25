
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export type City = "NYC" | "Chicago" | "LA";

const CitySelection = () => {
  const [selectedCity, setSelectedCity] = useState<City>("NYC");
  const navigate = useNavigate();

  const cities: { name: City; image: string }[] = [
    { name: "NYC", image: "/lovable-uploads/e1085649-7490-4989-a413-a86db207d414.png" },
    { name: "Chicago", image: "/lovable-uploads/6a74b48a-e905-464a-97fe-ce0ae56f7cf2.png" },
    { name: "LA", image: "/lovable-uploads/6c17a9a9-e53c-43bb-98f5-c75dd88ede97.png" }
  ];

  const handleContinue = () => {
    localStorage.setItem("selectedCity", selectedCity);
    navigate("/crew-invite");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-white mb-8">Choose Your City</h1>
      
      <div className="flex gap-4 mb-12">
        {cities.map((city) => (
          <motion.div
            key={city.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCity(city.name)}
            className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${
              selectedCity === city.name ? "ring-2 ring-blue-500 scale-105" : "opacity-50"
            }`}
          >
            <img
              src={city.image}
              alt={`${city.name} skyline`}
              className="w-48 h-64 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white text-center font-semibold">{city.name}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-2 rounded-full"
      >
        Continue
      </Button>
    </div>
  );
};

export default CitySelection;
