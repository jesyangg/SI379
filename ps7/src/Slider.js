import React from "react";

export default function Slider(props) {
    const { min, max, onChange, startingValue, disabled } = props;

    const [value, setValue] = React.useState(startingValue);

    React.useEffect(() => {
        setValue(startingValue);
    }, [startingValue]);

    const handleChange = React.useCallback(event => {
        if (disabled) return;
        
        const value = parseInt(event.target.value);
        setValue(value);
        onChange(value);
    }, [onChange, disabled]);

    return (
        <span className="slider-container">
            <input 
                type="number" 
                min={min} 
                max={max} 
                value={value} 
                onChange={handleChange} 
                disabled={disabled}
            />
            <input 
                type="range"  
                min={min} 
                max={max} 
                value={value} 
                onChange={handleChange} 
                disabled={disabled}
            />
        </span>
    );
}