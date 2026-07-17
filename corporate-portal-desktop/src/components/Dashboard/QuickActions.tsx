import { useNavigate } from "react-router-dom";
import Button from "../UI/Button";

export default function QuickActions() {
    const navigate = useNavigate();

    return (
        <div className="flex gap-4 mt-6">
            <Button onClick={() => navigate("/appeals")}>
                Создать обращение
            </Button>
            <Button variant="secondary" onClick={() => navigate("/forum")}>
                Новая тема форума
            </Button>
        </div>
    );
}
