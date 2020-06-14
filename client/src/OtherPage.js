import React from 'react';
import { Link } from 'react-router-dom';

export default () => {
    return (
        <div>
            Belin this is another page!
            <Link to="/">Go Back Home</Link>
        </div>
    );
};