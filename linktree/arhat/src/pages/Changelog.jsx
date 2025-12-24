import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Changelog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/changelog.json')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load changelog');
                return res.json();
            })
            .then(data => {
                setLogs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load changelog data.');
                setLoading(false);
            });
    }, []);

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 m-0">Changelog</h1>
                <Link to="/admin" className="btn btn-outline-primary">Back to Admin</Link>
            </div>

            {loading && <div className="text-center">Loading...</div>}
            
            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && !error && (
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                            <Table striped hover className="mb-0">
                                <thead className="table-light" style={{position: 'sticky', top: 0, zIndex: 1}}>
                                    <tr>
                                        <th style={{width: '150px'}}>Date</th>
                                        <th style={{width: '150px'}}>Time (UTC)</th>
                                        <th>Record</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="text-center text-muted py-4">
                                                <i className="fas fa-info-circle me-2"></i>No changelog records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log, index) => (
                                            <tr key={index}>
                                                <td>{log.date}</td>
                                                <td>{log.time}</td>
                                                <td>{log.message}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default Changelog;
